// src/customers/customers.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { Customer } from 'src/entities/customers/customer.entity';

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
    ) { }

    async create(dto: CreateCustomerDto, tenantId: string) {
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        return this.customerRepo.save({
            ...dto,
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
            .where('customer.tenant_id = :tenantId', { tenantId });

        if (query?.search) {
            queryBuilder.andWhere(
                '(LOWER(customer.name) LIKE LOWER(:search) OR LOWER(customer.lastname) LIKE LOWER(:search) OR LOWER(customer.email) LIKE LOWER(:search) OR LOWER(customer.phone) LIKE LOWER(:search) OR LOWER(customer.company_name) LIKE LOWER(:search))',
                { search: `%${query.search}%` }
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
        return this.customerRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'group'],
        });
    }

    async findOneWithAddresses(id: number, tenantId: string) {
        return this.customerRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'group', 'addresses'],
        });
    }

    async findOneWithActivities(id: number, tenantId: string) {
        return this.customerRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'group', 'activities'],
        });
    }
}
