// src/customers/customers.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerStatus } from 'src/entities/customers/customer-status.entity';
import { Customer } from 'src/entities/customers/customer.entity';
import { Tenant } from 'src/entities/tenant/tenant.entity';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(CustomerStatus) private statusRepo: Repository<CustomerStatus>,
    ) { }

    async create(dto: CreateCustomerDto) {
        const tenant = await this.tenantRepo.findOneByOrFail({ id: dto.tenant_id });
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        return this.customerRepo.save({
            name: dto.name,
            tenant,
            status,
        });
    }

    async update(id: number, dto: UpdateCustomerDto) {
        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            await this.customerRepo.update(id, { ...dto, status });
            return this.findOne(id);
        }

        await this.customerRepo.update(id, dto);
        return this.findOne(id);
    }

    findAll() {
        return this.customerRepo.find({ relations: ['tenant', 'status'] });
    }

    findOne(id: number) {
        return this.customerRepo.findOne({
            where: { id },
            relations: ['tenant', 'status'],
        });
    }
}
