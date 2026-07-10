// src/customers/customers.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CustomerStatus } from '../../entities/customers/customer-status.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { parsePhoneNumber } from '../../common/utils/phone.validator';

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
    ) { }

    private async resolveDefaultStatus(): Promise<CustomerStatus> {
        const active = await this.statusRepo.findOne({ where: { code: 'ACTIVE' } });
        if (active) return active;
        return this.statusRepo.findOneByOrFail({ id: 1 });
    }

    async findAllStatuses(): Promise<CustomerStatus[]> {
        return this.statusRepo.find({ order: { id: 'ASC' } });
    }

    async create(dto: CreateCustomerDto, tenantId: string) {
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

        return this.customerRepo.save({
            ...dto,
            phone,
            phone_code: phoneCode,
            additional_phone: additionalPhone,
            additional_phone_code: additionalPhoneCode,
            warehouse,
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
            .leftJoinAndSelect('customer.group', 'group')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
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
            .leftJoinAndSelect('customer.group', 'group')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
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
            .leftJoinAndSelect('customer.group', 'group')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.addresses', 'addresses')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
    }

    async findOneWithActivities(id: number, tenantId: string) {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect('customer.group', 'group')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoinAndSelect('customer.activities', 'activities')
            .where('customer.id = :id', { id })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
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
            throw new BadRequestException('warehouse_id is invalid for this tenant');
        }

        return warehouse;
    }
}
