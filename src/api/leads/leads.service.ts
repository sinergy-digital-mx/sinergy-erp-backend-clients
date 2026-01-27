// src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { PaginatedLeadsDto } from './dto/paginated-leads.dto';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { Lead } from 'src/entities/leads/lead.entity';
import { RBACTenant } from 'src/entities/rbac/tenant.entity';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Lead) private leadRepo: Repository<Lead>,
        @InjectRepository(LeadStatus) private statusRepo: Repository<LeadStatus>,
        @InjectRepository(RBACTenant) private tenantRepo: Repository<RBACTenant>,
    ) { }

    async create(dto: CreateLeadDto, tenantId: string) {
        let status;
        if (dto.status_id) {
            status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
        } else {
            // Use default 'new' status if none provided
            status = await this.statusRepo.findOneBy({ code: 'new' });
            if (!status) {
                // Fallback to first available status
                status = await this.statusRepo.findOne({});
            }
        }

        return this.leadRepo.save({
            ...dto,
            tenant: { id: tenantId },
            tenant_id: tenantId,
            status,
        });
    }

    async update(id: number, dto: UpdateLeadDto, tenantId: string) {
        const lead = await this.leadRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });

        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            lead.status = status;
        }

        Object.assign(lead, dto);
        return this.leadRepo.save(lead);
    }

    async findAll(tenantId: string, query: QueryLeadsDto): Promise<PaginatedLeadsDto> {
        const { page = 1, limit = 20, search, status_id } = query;
        const skip = (page - 1) * limit;

        const queryBuilder = this.leadRepo.createQueryBuilder('lead')
            .leftJoinAndSelect('lead.status', 'status')
            .leftJoinAndSelect('lead.tenant', 'tenant')
            .where('lead.tenant_id = :tenantId', { tenantId });

        // Add search functionality
        if (search) {
            queryBuilder.andWhere(
                '(lead.name ILIKE :search OR lead.lastname ILIKE :search OR lead.email ILIKE :search OR lead.phone ILIKE :search OR lead.company_name ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Add status filter
        if (status_id) {
            queryBuilder.andWhere('lead.status_id = :status_id', { status_id });
        }

        // Add ordering
        queryBuilder.orderBy('lead.created_at', 'DESC');

        // Get total count
        const total = await queryBuilder.getCount();

        // Get paginated results
        const leads = await queryBuilder
            .skip(skip)
            .take(limit)
            .getMany();

        const totalPages = Math.ceil(total / limit);

        return {
            data: leads,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    findOne(id: number, tenantId: string) {
        return this.leadRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'tenant', 'addresses', 'activities'],
        });
    }
}
