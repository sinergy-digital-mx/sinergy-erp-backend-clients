import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerGroup } from '../../entities/customers/customer-group.entity';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@Injectable()
export class CustomerGroupsService {
    constructor(
        @InjectRepository(CustomerGroup)
        private groupRepo: Repository<CustomerGroup>,
    ) {}

    async create(dto: CreateCustomerGroupDto, tenantId: string) {
        return this.groupRepo.save({
            ...dto,
            tenant_id: tenantId,
        });
    }

    async findAll(tenantId: string) {
        return this.groupRepo.find({
            where: { tenant_id: tenantId },
            relations: ['customers'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.groupRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['customers'],
        });
    }

    async update(id: string, dto: UpdateCustomerGroupDto, tenantId: string) {
        await this.groupRepo.update(
            { id, tenant_id: tenantId },
            dto,
        );
        return this.findOne(id, tenantId);
    }

    async remove(id: string, tenantId: string) {
        return this.groupRepo.delete({ id, tenant_id: tenantId });
    }

    async getGroupStats(tenantId: string) {
        const groups = await this.groupRepo.find({
            where: { tenant_id: tenantId },
            relations: ['customers'],
        });

        return groups.map(group => ({
            id: group.id,
            name: group.name,
            description: group.description,
            customer_count: group.customers?.length || 0,
            created_at: group.created_at,
        }));
    }
}
