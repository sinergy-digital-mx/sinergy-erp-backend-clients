// src/customers/customers.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
import { User } from '../../entities/users/user.entity';
import { parsePhoneNumber } from '../../common/utils/phone.validator';
import { hasValidGps } from '../../common/utils/geo.helper';
import { CustomerGroupsService } from './customer-groups.service';
import {
    composeFiscalAddress,
    hasSatStreetParts,
} from './utils/fiscal-domicile.util';

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
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(CustomerAddress)
        private addressRepo: Repository<CustomerAddress>,
        private readonly customerGroupsService: CustomerGroupsService,
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

        const registeredBillingBranchId = await this.resolveRegisteredBranchOrThrow(
            dto.registered_billing_branch_id,
            tenantId,
        );
        const registeredByUserId = await this.resolveRegisteredByUserOrThrow(
            dto.registered_by_user_id !== undefined
                ? dto.registered_by_user_id
                : currentUserId,
            tenantId,
        );

        this.applySatFiscalDomicilio(dto);

        return this.customerRepo.save({
            ...dto,
            group_id: groupId,
            phone,
            phone_code: phoneCode,
            additional_phone: additionalPhone,
            additional_phone_code: additionalPhoneCode,
            warehouse,
            registered_billing_branch_id: registeredBillingBranchId ?? null,
            registered_by_user_id: registeredByUserId ?? null,
            tenant_id: tenantId,
            status,
        });
    }

    async update(id: number, dto: UpdateCustomerDto, tenantId: string) {
        const customer = await this.customerRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });

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

        if (dto.registered_billing_branch_id !== undefined) {
            customer.registered_billing_branch_id =
                (await this.resolveRegisteredBranchOrThrow(
                    dto.registered_billing_branch_id,
                    tenantId,
                )) ?? null;
            delete dto.registered_billing_branch_id;
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

        Object.assign(customer, dto);
        return this.customerRepo.save(customer);
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
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
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

    findOne(id: number, tenantId: string) {
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
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
            ])
            .leftJoinAndSelect('customer.contracts', 'contracts')
            .leftJoinAndSelect('contracts.property', 'property')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
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
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
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
            .leftJoin('customer.registered_by_user', 'registeredByUser')
            .addSelect([
                'registeredByUser.id',
                'registeredByUser.first_name',
                'registeredByUser.last_name',
                'registeredByUser.email',
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
        const [branches, users] = await Promise.all([
            this.billingBranchRepo
                .createQueryBuilder('branch')
                .innerJoin('branch.fiscal_configuration', 'fc')
                .where('fc.tenant_id = :tenantId', { tenantId })
                .orderBy('branch.code', 'ASC')
                .getMany(),
            this.userRepo.find({
                where: { tenant_id: tenantId },
                select: ['id', 'first_name', 'last_name', 'email'],
                order: { first_name: 'ASC', last_name: 'ASC' },
            }),
        ]);

        return {
            branches: branches.map((branch) => ({
                id: branch.id,
                name: branch.code,
            })),
            users: users.map((user) => ({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
            })),
        };
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
}
