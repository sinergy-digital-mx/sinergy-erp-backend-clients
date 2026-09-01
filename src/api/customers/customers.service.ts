// src/customers/customers.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CheckCustomerDuplicatesDto } from './dto/check-customer-duplicates.dto';
import {
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from './dto/customer-address.dto';
import { CustomerStatus } from '../../entities/customers/customer-status.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CustomerAddress } from '../../entities/customers/customer-address.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { User } from '../../entities/users/user.entity';
import { parsePhoneNumber } from '../../common/utils/phone.validator';
import { hasValidGps } from '../../common/utils/geo.helper';
import { CustomerGroupsService } from './customer-groups.service';
import {
    composeFiscalAddress,
    hasSatStreetParts,
} from './utils/fiscal-domicile.util';
import { CustomerCreditService } from './services/customer-credit.service';
import { CustomerAssignmentService } from './services/customer-assignment.service';
import { getFiscalInvoiceReadiness } from './utils/fiscal-invoice-readiness.util';
import { mapCustomerCheckoutFields } from './utils/map-customer-checkout.util';
import { buildCreditSnapshot, extractCreditPatchFromBody } from './utils/customer-credit.util';
import { UpsertCustomerCreditsDto } from './dto/upsert-customer-credit.dto';
import {
    assignmentChange,
    compactAssignmentChanges,
    formatAssignmentUserLabel,
} from '../../common/utils/assignment-change.util';

const GENERIC_RFCS = new Set(['XAXX010101000', 'XEXX010101000']);
const DUPLICATE_MATCH_LIMIT = 10;

export type CustomerDuplicateMatchReason = 'email' | 'phone' | 'name' | 'rfc';

export interface CustomerDuplicateMatch {
    id: number;
    name: string;
    lastname: string | null;
    email: string | null;
    phone: string | null;
    phone_code: string | null;
    fiscal_rfc: string | null;
    company_name: string | null;
    status: CustomerStatus | null;
    match_reasons: CustomerDuplicateMatchReason[];
}

interface PaginatedCustomersDto {
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(CustomerStatus) private statusRepo: Repository<CustomerStatus>,
        @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
        @InjectRepository(BillingBranch)
        private billingBranchRepo: Repository<BillingBranch>,
        @InjectRepository(FiscalConfiguration)
        private fiscalConfigRepo: Repository<FiscalConfiguration>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(CustomerAddress)
        private addressRepo: Repository<CustomerAddress>,
        private readonly customerGroupsService: CustomerGroupsService,
        private readonly customerCreditService: CustomerCreditService,
        private readonly customerAssignmentService: CustomerAssignmentService,
    ) { }

    private async resolveDefaultStatus(): Promise<CustomerStatus> {
        const active = await this.statusRepo.findOne({ where: { code: 'ACTIVE' } });
        if (active) return active;
        return this.statusRepo.findOneByOrFail({ id: 1 });
    }

    async findAllStatuses(): Promise<CustomerStatus[]> {
        return this.statusRepo.find({ order: { id: 'ASC' } });
    }

    async create(dto: CreateCustomerDto, tenantId: string, currentUserId?: string) {
        const status = dto.status_id
            ? await this.statusRepo.findOneByOrFail({ id: dto.status_id })
            : await this.resolveDefaultStatus();

        // Extract country code and national number from phone if provided
        let phone = dto.phone;
        let phoneCode = dto.phone_code;

        if (phone) {
            const result = parsePhoneNumber(phone);

            if (result.isValid) {
                phone = result.nationalNumber; // Store only the national number
                phoneCode = result.countryCode; // Store the country code
            }
        }

        let additionalPhone = dto.additional_phone;
        let additionalPhoneCode = dto.additional_phone_code;
        if (additionalPhone) {
            const defaultForParse = additionalPhoneCode ?? phoneCode;
            const parsed = parsePhoneNumber(additionalPhone, defaultForParse);
            if (parsed.isValid) {
                additionalPhone = parsed.nationalNumber;
                additionalPhoneCode = parsed.countryCode;
            }
        }

        const warehouse =
            dto.warehouse_id !== undefined
                ? await this.resolveWarehouseOrThrow(dto.warehouse_id, tenantId)
                : undefined;

        const groupId = await this.customerGroupsService.assertBelongsToOrganization(
            dto.group_id,
            tenantId,
        );

        const registration = await this.resolveRegistrationAssignment(dto, tenantId);
        const assignedSellerUserId = await this.resolveAssignedSellerOrThrow(
            dto.assigned_seller_user_id,
            tenantId,
        );
        const registeredByUserId = await this.resolveRegisteredByUserOrThrow(
            dto.registered_by_user_id !== undefined
                ? dto.registered_by_user_id
                : currentUserId,
            tenantId,
        );
        delete dto.registered_fiscal_configuration_id;
        delete dto.registered_billing_branch_id;
        delete dto.assigned_seller_user_id;

        this.applySatFiscalDomicilio(dto);
        const creditPatch = this.extractCreditPatch(dto);
        this.stripLegacyCreditFields(dto);

        const saved = await this.customerRepo.save({
            ...dto,
            group_id: groupId,
            phone,
            phone_code: phoneCode,
            additional_phone: additionalPhone,
            additional_phone_code: additionalPhoneCode,
            warehouse,
            registered_fiscal_configuration_id: registration.fiscalId,
            registered_billing_branch_id: registration.branchId,
            assigned_seller_user_id: assignedSellerUserId ?? null,
            registered_by_user_id: registeredByUserId ?? null,
            tenant_id: tenantId,
            status,
            ...(creditPatch
                ? {
                      credit_enabled: creditPatch.credit_enabled,
                      credit_days: creditPatch.credit_days,
                      credit_amount: creditPatch.credit_amount,
                  }
                : {}),
        });
        if (creditPatch) {
            await this.customerCreditService.upsertForAllActiveFiscales(saved, creditPatch);
        }

        const initialChanges = await this.buildAssignmentChanges(
            tenantId,
            { fiscalId: null, branchId: null, sellerId: null },
            {
                fiscalId: saved.registered_fiscal_configuration_id,
                branchId: saved.registered_billing_branch_id,
                sellerId: saved.assigned_seller_user_id,
            },
        );
        await this.customerAssignmentService.record({
            tenantId,
            customerId: saved.id,
            actorId: currentUserId ?? null,
            type: 'assignment_initialized',
            changes: initialChanges,
        });

        return saved;
    }

    async update(id: number, dto: UpdateCustomerDto, tenantId: string, currentUserId?: string) {
        const customer = await this.customerRepo.findOneOrFail({
            where: { id, tenant_id: tenantId },
            relations: [
                'registered_fiscal_configuration',
                'registered_billing_branch',
                'assigned_seller_user',
            ],
        });
        const previousAssignment = {
            fiscalId: customer.registered_fiscal_configuration_id,
            branchId: customer.registered_billing_branch_id,
            sellerId: customer.assigned_seller_user_id,
        };

        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            customer.status = status;
        }

        // Extract country code and national number from phone if provided
        if (dto.phone) {
            const result = parsePhoneNumber(dto.phone);

            if (result.isValid) {
                dto.phone = result.nationalNumber; // Store only the national number
                dto.phone_code = result.countryCode; // Store the country code
            }
        }

        if (dto.additional_phone) {
            const defaultCode =
                dto.additional_phone_code ??
                customer.additional_phone_code ??
                dto.phone_code ??
                customer.phone_code;
            const parsed = parsePhoneNumber(dto.additional_phone, defaultCode);
            if (parsed.isValid) {
                dto.additional_phone = parsed.nationalNumber;
                dto.additional_phone_code = parsed.countryCode;
            }
        }

        if (dto.warehouse_id !== undefined) {
            customer.warehouse = await this.resolveWarehouseOrThrow(dto.warehouse_id, tenantId);
        }

        if (dto.group_id !== undefined) {
            customer.group_id = await this.customerGroupsService.assertBelongsToOrganization(
                dto.group_id,
                tenantId,
            );
            delete dto.group_id;
        }

        if (
            dto.registered_fiscal_configuration_id !== undefined ||
            dto.registered_billing_branch_id !== undefined
        ) {
            const registration = await this.resolveRegistrationAssignment(dto, tenantId, customer);
            customer.registered_fiscal_configuration_id = registration.fiscalId;
            customer.registered_billing_branch_id = registration.branchId;
            delete dto.registered_fiscal_configuration_id;
            delete dto.registered_billing_branch_id;
        }

        if (dto.assigned_seller_user_id !== undefined) {
            customer.assigned_seller_user_id =
                (await this.resolveAssignedSellerOrThrow(
                    dto.assigned_seller_user_id,
                    tenantId,
                )) ?? null;
            delete dto.assigned_seller_user_id;
        }

        if (dto.registered_by_user_id !== undefined) {
            customer.registered_by_user_id =
                (await this.resolveRegisteredByUserOrThrow(
                    dto.registered_by_user_id,
                    tenantId,
                )) ?? null;
            delete dto.registered_by_user_id;
        }

        this.applySatFiscalDomicilio(dto, customer);
        const creditPatch = this.extractCreditPatch(dto);
        this.stripLegacyCreditFields(dto);
        if (creditPatch) {
            this.applyCreditPatchToCustomer(customer, creditPatch);
        }

        Object.assign(customer, dto);
        const saved = await this.customerRepo.save(customer);
        if (creditPatch) {
            await this.customerCreditService.upsertForAllActiveFiscales(saved, creditPatch);
        }

        const assignmentChanges = await this.buildAssignmentChanges(
            tenantId,
            previousAssignment,
            {
                fiscalId: saved.registered_fiscal_configuration_id,
                branchId: saved.registered_billing_branch_id,
                sellerId: saved.assigned_seller_user_id,
            },
        );
        await this.customerAssignmentService.record({
            tenantId,
            customerId: saved.id,
            actorId: currentUserId ?? null,
            type: 'assignment_updated',
            changes: assignmentChanges,
        });

        const enriched = await this.findOne(saved.id, tenantId);
        if (!enriched) {
            throw new NotFoundException('Cliente no encontrado');
        }
        return enriched;
    }

    async findAll(tenantId: string, query?: QueryCustomersDto): Promise<PaginatedCustomersDto> {
        let page = Number(query?.page) || 1;
        let limit = Number(query?.limit) || 20;
        
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        if (limit > 100) limit = 100;
        
        const skip = (page - 1) * limit;

        const queryBuilder = this.customerRepo.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect(
                'customer.group',
                'group',
                'group.tenant_id = customer.tenant_id',
            )
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect([
                'registeredFiscal.id',
                'registeredFiscal.razon_social',
                'registeredFiscal.rfc',
            ])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
            ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
                'assignedSeller.id',
                'assignedSeller.first_name',
                'assignedSeller.last_name',
                'assignedSeller.email',
                'assignedSeller.pos_user_code',
            ])
            .leftJoin('customer.contracts', 'contracts')
            .leftJoin('contracts.property', 'property')
            .addSelect(['contracts.id', 'contracts.status', 'contracts.contract_number', 'property.id', 'property.code', 'property.name', 'property.status'])
            .where('customer.tenant_id = :tenantId', { tenantId });

        if (query?.search) {
            const term = `%${query.search.trim()}%`;
            queryBuilder.andWhere(
                `(
                    LOWER(customer.name) LIKE LOWER(:search)
                    OR LOWER(customer.lastname) LIKE LOWER(:search)
                    OR LOWER(CONCAT(customer.name, ' ', COALESCE(customer.lastname, ''))) LIKE LOWER(:search)
                    OR LOWER(CONCAT(COALESCE(customer.lastname, ''), ' ', customer.name)) LIKE LOWER(:search)
                    OR LOWER(customer.email) LIKE LOWER(:search)
                    OR LOWER(customer.phone) LIKE LOWER(:search)
                    OR LOWER(customer.phone_code) LIKE LOWER(:search)
                    OR LOWER(CONCAT(COALESCE(customer.phone_code, ''), customer.phone)) LIKE LOWER(:search)
                    OR LOWER(customer.company_name) LIKE LOWER(:search)
                    OR LOWER(customer.website) LIKE LOWER(:search)
                    OR LOWER(customer.additional_name) LIKE LOWER(:search)
                    OR LOWER(customer.additional_lastname) LIKE LOWER(:search)
                    OR LOWER(CONCAT(customer.additional_name, ' ', COALESCE(customer.additional_lastname, ''))) LIKE LOWER(:search)
                    OR LOWER(customer.additional_email) LIKE LOWER(:search)
                    OR LOWER(customer.additional_phone) LIKE LOWER(:search)
                    OR LOWER(customer.fiscal_rfc) LIKE LOWER(:search)
                    OR LOWER(customer.fiscal_razon_social) LIKE LOWER(:search)
                    OR LOWER(property.code) LIKE LOWER(:search)
                    OR LOWER(property.name) LIKE LOWER(:search)
                    OR LOWER(property.cadastral_key) LIKE LOWER(:search)
                    OR LOWER(contracts.contract_number) LIKE LOWER(:search)
                )`,
                { search: term },
            );
        }

        if (query?.status_id) {
            queryBuilder.andWhere('customer.status_id = :status_id', { status_id: query.status_id });
        }

        if (query?.group_id) {
            queryBuilder.andWhere('customer.group_id = :group_id', { group_id: query.group_id });
        }

        queryBuilder.orderBy('customer.created_at', 'DESC');

        const total = await queryBuilder.getCount();
        const customers = await queryBuilder
            .skip(skip)
            .take(limit)
            .getMany();

        const totalPages = Math.ceil(total / limit);

        return {
            data: customers,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    async findOne(id: number, tenantId: string, fiscalConfigurationId?: string) {
        const customer = await this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect(
                'customer.group',
                'group',
                'group.tenant_id = customer.tenant_id',
            )
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect([
                'registeredFiscal.id',
                'registeredFiscal.razon_social',
                'registeredFiscal.rfc',
            ])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
            ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
                'assignedSeller.id',
                'assignedSeller.first_name',
                'assignedSeller.last_name',
                'assignedSeller.email',
                'assignedSeller.pos_user_code',
            ])
            .leftJoinAndSelect('customer.contracts', 'contracts')
            .leftJoinAndSelect('contracts.property', 'property')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();

        if (!customer) {
            return null;
        }

        return this.enrichCustomer(customer, fiscalConfigurationId);
    }

    async listCredits(id: number, tenantId: string) {
        const customer = await this.customerRepo.findOneBy({ id, tenant_id: tenantId });
        if (!customer) {
            throw new NotFoundException('Cliente no encontrado');
        }
        return this.customerCreditService.listForCustomer(customer);
    }

    async upsertCredits(
        id: number,
        dto: UpsertCustomerCreditsDto,
        tenantId: string,
    ) {
        const customer = await this.customerRepo.findOneBy({ id, tenant_id: tenantId });
        if (!customer) {
            throw new NotFoundException('Cliente no encontrado');
        }
        return this.customerCreditService.upsertMany(customer, dto.credits);
    }

    async findOneWithAddresses(id: number, tenantId: string) {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect(
                'customer.group',
                'group',
                'group.tenant_id = customer.tenant_id',
            )
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect([
                'registeredFiscal.id',
                'registeredFiscal.razon_social',
                'registeredFiscal.rfc',
            ])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
            ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
                'assignedSeller.id',
                'assignedSeller.first_name',
                'assignedSeller.last_name',
                'assignedSeller.email',
                'assignedSeller.pos_user_code',
            ])
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
    }

    async findOneWithActivities(id: number, tenantId: string) {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect(
                'customer.group',
                'group',
                'group.tenant_id = customer.tenant_id',
            )
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.registered_billing_branch', 'registeredBranch')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect([
                'registeredFiscal.id',
                'registeredFiscal.razon_social',
                'registeredFiscal.rfc',
            ])
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
            ])
            .leftJoin('customer.assigned_seller_user', 'assignedSeller')
            .addSelect([
                'assignedSeller.id',
                'assignedSeller.first_name',
                'assignedSeller.last_name',
                'assignedSeller.email',
                'assignedSeller.pos_user_code',
            ])
            .leftJoinAndSelect('customer.activities', 'activities')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
    }

    async createAddress(
        customerId: number,
        dto: CreateCustomerAddressDto,
        tenantId: string,
    ): Promise<CustomerAddress> {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new NotFoundException('Cliente no encontrado');
        }

        const lat = dto.latitude ?? null;
        const lng = dto.longitude ?? null;
        const gpsOk = hasValidGps({ latitude: lat, longitude: lng });

        const address = this.addressRepo.create({
            ...dto,
            customer_id: customerId,
            tenant_id: tenantId,
            latitude: lat,
            longitude: lng,
            has_gps: gpsOk ? 1 : 0,
            address_source: dto.address_source || (gpsOk ? 'manual' : 'without_location'),
            status: 1,
            is_primary: dto.is_primary ?? false,
        });

        return this.addressRepo.save(address);
    }

    async updateAddress(
        customerId: number,
        addressId: number,
        dto: UpdateCustomerAddressDto,
        tenantId: string,
    ): Promise<CustomerAddress> {
        const address = await this.addressRepo.findOne({
            where: {
                id: addressId,
                customer_id: customerId,
                tenant_id: tenantId,
            },
        });
        if (!address) {
            throw new NotFoundException('Dirección no encontrada');
        }

        Object.assign(address, dto);

        const gpsOk = hasValidGps(address);
        address.has_gps = gpsOk ? 1 : 0;
        if (dto.latitude !== undefined || dto.longitude !== undefined) {
            address.address_source =
                dto.address_source ||
                (gpsOk ? 'manual' : 'without_location');
        }

        return this.addressRepo.save(address);
    }

    private async resolveWarehouseOrThrow(
        warehouseId: string | null | undefined,
        tenantId: string,
    ): Promise<Warehouse | null> {
        if (warehouseId === null || warehouseId === '') {
            return null;
        }

        const warehouse = await this.warehouseRepo.findOne({
            where: {
                id: warehouseId,
                tenant_id: tenantId,
            },
        });

        if (!warehouse) {
            throw new BadRequestException(
                'warehouse_id no es válido para esta organización',
            );
        }

        return warehouse;
    }

    async getRegistrationOptions(tenantId: string) {
        const [fiscales, users, sellers] = await Promise.all([
            this.fiscalConfigRepo.find({
                where: { tenant_id: tenantId },
                relations: ['branches'],
                order: { razon_social: 'ASC' },
            }),
            this.userRepo.find({
                where: { tenant_id: tenantId },
                select: ['id', 'first_name', 'last_name', 'email'],
                order: { first_name: 'ASC', last_name: 'ASC' },
            }),
            this.userRepo.find({
                where: { tenant_id: tenantId, pos_user_code: Not(IsNull()) },
                select: ['id', 'first_name', 'last_name', 'email', 'pos_user_code'],
                order: { first_name: 'ASC', last_name: 'ASC' },
            }),
        ]);

        const fiscalConfigurations = fiscales.map((fiscal) => ({
            id: fiscal.id,
            razon_social: fiscal.razon_social,
            rfc: fiscal.rfc,
            status: fiscal.status,
            branches: [...(fiscal.branches ?? [])]
                .sort((a, b) => a.code.localeCompare(b.code, 'es'))
                .map((branch) => ({
                    id: branch.id,
                    name: branch.code,
                })),
        }));

        return {
            fiscal_configurations: fiscalConfigurations,
            users: users.map((user) => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            })),
            sellers: sellers.map((user) => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                pos_user_code: user.pos_user_code,
            })),
        };
    }

    async getAssignmentHistory(id: number, tenantId: string) {
        const data = await this.customerAssignmentService.listForCustomer(id, tenantId);
        return { data, total: data.length };
    }

    async findDuplicates(
        dto: CheckCustomerDuplicatesDto,
        tenantId: string,
    ): Promise<{ found: boolean; matches: CustomerDuplicateMatch[] }> {
        const email = this.normalizeEmail(dto.email);
        const phone = this.normalizePhone(dto.phone, dto.phone_code);
        const name = this.normalizePersonName(dto.name);
        const lastname = this.normalizePersonName(dto.lastname);
        const rfc = this.normalizeRfc(dto.fiscal_rfc);

        const orConditions: string[] = [];
        const params: Record<string, string> = { tenantId };

        if (email) {
            orConditions.push('LOWER(TRIM(customer.email)) = :email');
            params.email = email;
        }

        if (phone) {
            orConditions.push(
                `REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(customer.phone, ''), ' ', ''), '-', ''), '(', ''), ')', '') = :phone`,
            );
            params.phone = phone;
        }

        if (name && lastname) {
            orConditions.push(
                'LOWER(TRIM(customer.name)) = :name AND LOWER(TRIM(customer.lastname)) = :lastname',
            );
            params.name = name;
            params.lastname = lastname;
        }

        if (rfc && !GENERIC_RFCS.has(rfc)) {
            orConditions.push(
                `REPLACE(REPLACE(UPPER(TRIM(COALESCE(customer.fiscal_rfc, ''))), '-', ''), ' ', '') = :rfc`,
            );
            params.rfc = rfc;
        }

        if (orConditions.length === 0) {
            return { found: false, matches: [] };
        }

        const customers = await this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .where('customer.tenant_id = :tenantId', { tenantId })
            .andWhere(`(${orConditions.join(' OR ')})`, params)
            .orderBy('customer.created_at', 'DESC')
            .take(DUPLICATE_MATCH_LIMIT)
            .getMany();

        const matches = customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            lastname: customer.lastname ?? null,
            email: customer.email ?? null,
            phone: customer.phone ?? null,
            phone_code: customer.phone_code ?? null,
            fiscal_rfc: customer.fiscal_rfc ?? null,
            company_name: customer.company_name ?? null,
            status: customer.status ?? null,
            match_reasons: this.resolveMatchReasons(customer, {
                email,
                phone,
                name,
                lastname,
                rfc,
            }),
        }));

        return {
            found: matches.length > 0,
            matches,
        };
    }

    private resolveMatchReasons(
        customer: Customer,
        input: {
            email: string | null;
            phone: string | null;
            name: string | null;
            lastname: string | null;
            rfc: string | null;
        },
    ): CustomerDuplicateMatchReason[] {
        const reasons: CustomerDuplicateMatchReason[] = [];

        if (input.email && this.normalizeEmail(customer.email) === input.email) {
            reasons.push('email');
        }

        if (input.phone && this.normalizePhone(customer.phone) === input.phone) {
            reasons.push('phone');
        }

        if (
            input.name &&
            input.lastname &&
            this.normalizePersonName(customer.name) === input.name &&
            this.normalizePersonName(customer.lastname) === input.lastname
        ) {
            reasons.push('name');
        }

        if (
            input.rfc &&
            !GENERIC_RFCS.has(input.rfc) &&
            this.normalizeRfc(customer.fiscal_rfc) === input.rfc
        ) {
            reasons.push('rfc');
        }

        return reasons;
    }

    private normalizeEmail(value?: string | null): string | null {
        const email = value?.trim().toLowerCase();
        return email || null;
    }

    private normalizePersonName(value?: string | null): string | null {
        const name = value?.trim().toLowerCase().replace(/\s+/g, ' ');
        return name || null;
    }

    private normalizeRfc(value?: string | null): string | null {
        const rfc = value?.trim().toUpperCase().replace(/[\s-]/g, '');
        return rfc || null;
    }

    private normalizePhone(phone?: string | null, phoneCode?: string | null): string | null {
        if (!phone?.trim()) {
            return null;
        }

        const parsed = parsePhoneNumber(phone, phoneCode ?? undefined);
        if (parsed.isValid) {
            return parsed.nationalNumber.replace(/\D/g, '');
        }

        const digits = phone.replace(/\D/g, '');
        return digits || null;
    }

    private async resolveRegisteredBranchOrThrow(
        branchId: string | null | undefined,
        tenantId: string,
    ): Promise<string | null | undefined> {
        if (branchId === undefined) {
            return undefined;
        }
        if (branchId === null || branchId === '') {
            return null;
        }

        const branch = await this.billingBranchRepo
            .createQueryBuilder('branch')
            .innerJoin('branch.fiscal_configuration', 'fc')
            .where('branch.id = :branchId', { branchId })
            .andWhere('fc.tenant_id = :tenantId', { tenantId })
            .getOne();

        if (!branch) {
            throw new BadRequestException(
                'La sucursal de registro no es válida para esta organización',
            );
        }

        return branch.id;
    }

    private async resolveRegisteredByUserOrThrow(
        userId: string | null | undefined,
        tenantId: string,
    ): Promise<string | null | undefined> {
        if (userId === undefined) {
            return undefined;
        }
        if (userId === null || userId === '') {
            return null;
        }

        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            select: ['id'],
        });

        if (!user) {
            throw new BadRequestException(
                'El usuario que registra no es válido para esta organización',
            );
        }

        return user.id;
    }

    private async resolveRegisteredFiscalOrThrow(
        fiscalId: string | null | undefined,
        tenantId: string,
    ): Promise<string | null | undefined> {
        if (fiscalId === undefined) {
            return undefined;
        }
        if (fiscalId === null || fiscalId === '') {
            return null;
        }

        const fiscal = await this.fiscalConfigRepo.findOne({
            where: { id: fiscalId, tenant_id: tenantId },
            select: ['id'],
        });

        if (!fiscal) {
            throw new BadRequestException(
                'La razón social de registro no es válida para esta organización',
            );
        }

        return fiscal.id;
    }

    private async resolveAssignedSellerOrThrow(
        userId: string | null | undefined,
        tenantId: string,
    ): Promise<string | null | undefined> {
        if (userId === undefined) {
            return undefined;
        }
        if (userId === null || userId === '') {
            return null;
        }

        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            select: ['id', 'pos_user_code'],
        });

        if (!user) {
            throw new BadRequestException(
                'El vendedor asignado no es válido para esta organización',
            );
        }

        if (user.pos_user_code == null) {
            throw new BadRequestException(
                'El vendedor asignado debe tener un código POS',
            );
        }

        return user.id;
    }

    private async resolveRegistrationAssignment(
        dto: {
            registered_fiscal_configuration_id?: string | null;
            registered_billing_branch_id?: string | null;
        },
        tenantId: string,
        existing?: Customer,
    ): Promise<{ fiscalId: string | null; branchId: string | null }> {
        const fiscalTouched = dto.registered_fiscal_configuration_id !== undefined;
        const branchTouched = dto.registered_billing_branch_id !== undefined;

        let fiscalId = fiscalTouched
            ? await this.resolveRegisteredFiscalOrThrow(
                  dto.registered_fiscal_configuration_id,
                  tenantId,
              )
            : existing?.registered_fiscal_configuration_id ?? null;

        let branchId = branchTouched
            ? await this.resolveRegisteredBranchOrThrow(
                  dto.registered_billing_branch_id,
                  tenantId,
              )
            : existing?.registered_billing_branch_id ?? null;

        fiscalId = fiscalId ?? null;
        branchId = branchId ?? null;

        if (branchId) {
            const branch = await this.billingBranchRepo
                .createQueryBuilder('branch')
                .innerJoin('branch.fiscal_configuration', 'fc')
                .addSelect(['branch.id', 'branch.fiscal_configuration_id'])
                .where('branch.id = :branchId', { branchId })
                .andWhere('fc.tenant_id = :tenantId', { tenantId })
                .getOne();

            if (!branch) {
                throw new BadRequestException(
                    'La sucursal de registro no es válida para esta organización',
                );
            }

            if (fiscalId && branch.fiscal_configuration_id !== fiscalId) {
                if (fiscalTouched && !branchTouched) {
                    branchId = null;
                } else {
                    throw new BadRequestException(
                        'La sucursal de registro no pertenece a la razón social seleccionada',
                    );
                }
            }

            if (!fiscalId) {
                fiscalId = branch.fiscal_configuration_id;
            }
        }

        return { fiscalId, branchId };
    }

    private async buildAssignmentChanges(
        tenantId: string,
        previous: { fiscalId: string | null; branchId: string | null; sellerId: string | null },
        next: { fiscalId: string | null; branchId: string | null; sellerId: string | null },
    ) {
        const [previousLabels, nextLabels] = await Promise.all([
            this.loadAssignmentLabels(tenantId, previous),
            this.loadAssignmentLabels(tenantId, next),
        ]);

        return compactAssignmentChanges([
            assignmentChange(
                'registered_fiscal_configuration_id',
                'Razón social de registro',
                previousLabels.fiscalLabel,
                nextLabels.fiscalLabel,
                previous.fiscalId,
                next.fiscalId,
            ),
            assignmentChange(
                'registered_billing_branch_id',
                'Sucursal de registro',
                previousLabels.branchLabel,
                nextLabels.branchLabel,
                previous.branchId,
                next.branchId,
            ),
            assignmentChange(
                'assigned_seller_user_id',
                'Vendedor asignado',
                previousLabels.sellerLabel,
                nextLabels.sellerLabel,
                previous.sellerId,
                next.sellerId,
            ),
        ]);
    }

    private async loadAssignmentLabels(
        tenantId: string,
        ids: { fiscalId: string | null; branchId: string | null; sellerId: string | null },
    ): Promise<{ fiscalLabel: string | null; branchLabel: string | null; sellerLabel: string | null }> {
        const [fiscal, branch, seller] = await Promise.all([
            ids.fiscalId
                ? this.fiscalConfigRepo.findOne({
                      where: { id: ids.fiscalId, tenant_id: tenantId },
                      select: ['id', 'razon_social'],
                  })
                : Promise.resolve(null),
            ids.branchId
                ? this.billingBranchRepo.findOne({
                      where: { id: ids.branchId },
                      select: ['id', 'code'],
                  })
                : Promise.resolve(null),
            ids.sellerId
                ? this.userRepo.findOne({
                      where: { id: ids.sellerId, tenant_id: tenantId },
                      select: ['id', 'first_name', 'last_name', 'email', 'pos_user_code'],
                  })
                : Promise.resolve(null),
        ]);

        return {
            fiscalLabel: fiscal?.razon_social ?? null,
            branchLabel: branch?.code ?? null,
            sellerLabel: formatAssignmentUserLabel(seller),
        };
    }

    /** Completa municipio legado y `fiscal_address` desde el domicilio SAT. */
    private applySatFiscalDomicilio(
        dto: CreateCustomerDto | UpdateCustomerDto,
        existing?: Customer,
    ): void {
        if (dto.fiscal_municipio !== undefined && dto.fiscal_city === undefined) {
            dto.fiscal_city = dto.fiscal_municipio;
        }

        const hasFiscalDomicile =
            hasSatStreetParts(dto) ||
            dto.fiscal_municipio !== undefined ||
            dto.fiscal_localidad !== undefined ||
            dto.fiscal_postal_code !== undefined ||
            dto.fiscal_state !== undefined;

        if (hasFiscalDomicile && dto.fiscal_country === undefined && !existing?.fiscal_country) {
            dto.fiscal_country = 'MEX';
        }

        if (dto.fiscal_address !== undefined || !hasSatStreetParts(dto)) {
            return;
        }

        const composed = composeFiscalAddress({
            street: dto.fiscal_street ?? existing?.fiscal_street,
            exteriorNumber: dto.fiscal_exterior_number ?? existing?.fiscal_exterior_number,
            interiorNumber: dto.fiscal_interior_number ?? existing?.fiscal_interior_number,
            colonia: dto.fiscal_colonia ?? existing?.fiscal_colonia,
        });
        if (composed) {
            dto.fiscal_address = composed;
        }
    }

    private extractCreditPatch(
        dto: CreateCustomerDto | UpdateCustomerDto,
    ): {
        credit_enabled: boolean;
        credit_days?: number | null;
        credit_amount?: number | null;
    } | null {
        return extractCreditPatchFromBody(dto as unknown as Record<string, unknown>);
    }

    private applyCreditPatchToCustomer(
        customer: Customer,
        patch: {
            credit_enabled: boolean;
            credit_days?: number | null;
            credit_amount?: number | null;
        },
    ): void {
        customer.credit_enabled = patch.credit_enabled;
        customer.credit_days = patch.credit_days ?? null;
        customer.credit_amount = patch.credit_amount ?? null;
    }

    private stripLegacyCreditFields(dto: CreateCustomerDto | UpdateCustomerDto): void {
        delete (dto as { credit_enabled?: boolean }).credit_enabled;
        delete (dto as { credit_days?: number }).credit_days;
        delete (dto as { credit_amount?: number }).credit_amount;
    }

    private async enrichCustomer(customer: Customer, fiscalConfigurationId?: string) {
        const credits = await this.customerCreditService.listForCustomer(customer);
        const fiscal = getFiscalInvoiceReadiness(customer);
        const activeCredit = fiscalConfigurationId
            ? await this.customerCreditService.getSnapshotForFiscal(
                customer,
                fiscalConfigurationId,
            )
            : credits.find((item) => item.credit_enabled) ??
              buildCreditSnapshot({ creditEnabled: false });
        const mapped = mapCustomerCheckoutFields(
            customer,
            credits,
            fiscal,
            activeCredit,
        );
        const assignment_history =
            await this.customerAssignmentService.listForExistingCustomer(
                customer.id,
                customer.tenant_id,
            );
        const rest = { ...customer } as Record<string, unknown>;
        delete rest.credit_enabled;
        delete rest.credit_days;
        delete rest.credit_amount;
        return {
            ...rest,
            ...mapped,
            assignment_history,
        };
    }
}
