import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CustomerGroup } from '../../entities/customers/customer-group.entity';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

function assertOrganizationId(organizationId: string) {
    if (!organizationId) {
        throw new UnauthorizedException(
            'El contexto de la organización es obligatorio',
        );
    }
}

export type CustomerGroupResponse = {
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    customer_count: number;
    created_at: Date;
    updated_at: Date;
};

export type CustomerGroupOption = {
    id: string;
    name: string;
};

@Injectable()
export class CustomerGroupsService {
    constructor(
        @InjectRepository(CustomerGroup)
        private groupRepo: Repository<CustomerGroup>,
    ) {}

    async create(dto: CreateCustomerGroupDto, organizationId: string) {
        assertOrganizationId(organizationId);
        await this.assertUniqueName(organizationId, dto.name.trim());

        const group = this.groupRepo.create({
            name: dto.name.trim(),
            description: dto.description?.trim() || null,
            tenant_id: organizationId,
            is_system: false,
        });
        const saved = await this.groupRepo.save(group);

        return this.findOne(saved.id, organizationId);
    }

    /**
     * Lista grupos de la organización actual con conteo de clientes.
     * Nunca mezcla grupos de otra organización.
     */
    async findAll(organizationId: string): Promise<CustomerGroupResponse[]> {
        assertOrganizationId(organizationId);
        const groups = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.tenant_id = :organizationId', { organizationId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .orderBy('g.name', 'ASC')
            .getMany();
        return groups.map((g) => this.toGroupResponse(g));
    }

    /** Catálogo liviano para filtros y selects (mismo aislamiento). */
    async findOptions(organizationId: string): Promise<CustomerGroupOption[]> {
        assertOrganizationId(organizationId);
        const groups = await this.groupRepo.find({
            where: { tenant_id: organizationId },
            select: ['id', 'name'],
            order: { name: 'ASC' },
        });
        return groups.map((g) => ({ id: g.id, name: g.name }));
    }

    async findOne(id: string, organizationId: string): Promise<CustomerGroupResponse> {
        assertOrganizationId(organizationId);
        const group = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.id = :id', { id })
            .andWhere('g.tenant_id = :organizationId', { organizationId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .getOne();

        if (!group) {
            throw new NotFoundException('El grupo no existe');
        }

        return this.toGroupResponse(group);
    }

    async update(
        id: string,
        dto: UpdateCustomerGroupDto,
        organizationId: string,
    ): Promise<CustomerGroupResponse> {
        assertOrganizationId(organizationId);
        const group = await this.groupRepo.findOne({
            where: { id, tenant_id: organizationId },
        });
        if (!group) {
            throw new NotFoundException('El grupo no existe');
        }

        if (dto.name !== undefined) {
            await this.assertUniqueName(organizationId, dto.name.trim(), id);
            group.name = dto.name.trim();
        }
        if (dto.description !== undefined) {
            group.description = dto.description?.trim() || null;
        }

        await this.groupRepo.save(group);
        return this.findOne(id, organizationId);
    }

    async remove(id: string, organizationId: string): Promise<{ deleted: true }> {
        assertOrganizationId(organizationId);
        const group = await this.groupRepo.findOne({
            where: { id, tenant_id: organizationId },
        });
        if (!group) {
            throw new NotFoundException('El grupo no existe');
        }

        if (group.is_system) {
            throw new BadRequestException(
                'Este grupo no se puede eliminar porque está en uso por datos históricos',
            );
        }

        const customerCount = await this.groupRepo
            .createQueryBuilder('g')
            .leftJoin('g.customers', 'c')
            .where('g.id = :id', { id })
            .andWhere('g.tenant_id = :organizationId', { organizationId })
            .select('COUNT(c.id)', 'count')
            .getRawOne<{ count: string }>();

        if (Number(customerCount?.count ?? 0) > 0) {
            throw new BadRequestException(
                'No se puede eliminar el grupo porque tiene clientes asignados',
            );
        }

        const propertyRows: Array<{ count: string | number }> =
            await this.groupRepo.manager.query(
                `SELECT COUNT(*) AS count FROM properties WHERE group_id = ? AND tenant_id = ?`,
                [id, organizationId],
            );
        if (Number(propertyRows[0]?.count ?? 0) > 0) {
            throw new BadRequestException(
                'No se puede eliminar el grupo porque tiene lotes asignados',
            );
        }

        await this.groupRepo.delete({ id, tenant_id: organizationId });
        return { deleted: true };
    }

    async assertBelongsToOrganization(
        groupId: string | null | undefined,
        organizationId: string,
    ): Promise<string | null> {
        assertOrganizationId(organizationId);
        if (groupId === null || groupId === undefined || groupId === '') {
            return null;
        }

        const group = await this.groupRepo.findOne({
            where: { id: groupId, tenant_id: organizationId },
            select: ['id'],
        });

        if (!group) {
            throw new BadRequestException(
                'group_id no es válido para esta organización',
            );
        }

        return group.id;
    }

    private async assertUniqueName(
        organizationId: string,
        name: string,
        excludeId?: string,
    ) {
        const existing = await this.groupRepo.findOne({
            where: {
                tenant_id: organizationId,
                name,
                ...(excludeId ? { id: Not(excludeId) } : {}),
            },
        });

        if (existing) {
            throw new ConflictException('Ya existe un grupo con ese nombre');
        }
    }

    private toGroupResponse(g: CustomerGroup): CustomerGroupResponse {
        const customerCount = (g as { customerCount?: number }).customerCount ?? 0;
        return {
            id: g.id,
            name: g.name,
            description: g.description ?? null,
            is_system: Boolean(g.is_system),
            customer_count: customerCount,
            created_at: g.created_at,
            updated_at: g.updated_at,
        };
    }
}
