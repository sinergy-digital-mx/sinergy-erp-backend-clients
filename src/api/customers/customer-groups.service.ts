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

    /**
     * Lista grupos con conteo de clientes sin hidratar `customers`.
     * Evita SELECT de todas las columnas de Customer (p. ej. additional_*): si la BD
     * aún no tiene esas columnas, cargar la relación completa rompe con ER_BAD_FIELD_ERROR.
     */
    async findAll(tenantId: string) {
        const groups = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.tenant_id = :tenantId', { tenantId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .orderBy('g.created_at', 'DESC')
            .getMany();
        return this.toGroupListResponse(groups);
    }

    async findOne(id: string, tenantId: string) {
        const group = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.id = :id', { id })
            .andWhere('g.tenant_id = :tenantId', { tenantId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .getOne();
        return group ? this.toGroupOneResponse(group) : null;
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
        const groups = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.tenant_id = :tenantId', { tenantId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .getMany();

        return groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            customer_count: (group as { customerCount?: number }).customerCount ?? 0,
            created_at: group.created_at,
        }));
    }

    private toGroupListResponse(groups: CustomerGroup[]) {
        return groups.map((g) => this.toGroupOneResponse(g));
    }

    private toGroupOneResponse(g: CustomerGroup) {
        const customerCount = (g as { customerCount?: number }).customerCount ?? 0;
        return {
            id: g.id,
            tenant_id: g.tenant_id,
            name: g.name,
            description: g.description,
            created_at: g.created_at,
            updated_at: g.updated_at,
            customer_count: customerCount,
        };
    }
}
