// src/customers/customers.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { Customer } from 'src/entities/customers/customer.entity';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(RBACTenant) private tenantRepo: Repository<RBACTenant>,
        @InjectRepository(CustomerStatus) private statusRepo: Repository<CustomerStatus>,
    ) { }

    async create(dto: CreateCustomerDto, tenantId: string) {
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        return this.customerRepo.save({
            ...dto,
            tenant: { id: tenantId },
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

    findAll(tenantId: string) {
        return this.customerRepo.find({
            where: { tenant_id: tenantId },
            relations: ['status', 'tenant'],
        });
    }

    findOne(id: number, tenantId: string) {
        return this.customerRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'tenant'],
        });
    }
}
