// src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { PaginatedLeadsDto } from './dto/paginated-leads.dto';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { Lead } from 'src/entities/leads/lead.entity';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Lead) private leadRepo: Repository<Lead>,
        @InjectRepository(LeadStatus) private statusRepo: Repository<LeadStatus>,
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
        // Ensure page and limit are numbers
        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 20;
        
        // Validate ranges
        if (page < 1) page = 1;
        if (limit < 1) limit = 1;
        if (limit > 100) limit = 100;
        
        const skip = (page - 1) * limit;

        const queryBuilder = this.leadRepo.createQueryBuilder('lead')
            .leftJoinAndSelect('lead.status', 'status')
            .leftJoinAndSelect('lead.tenant', 'tenant')
            .leftJoinAndSelect('lead.group', 'group')
            .where('lead.tenant_id = :tenantId', { tenantId });

        // Add search functionality
        if (query.search) {
            queryBuilder.andWhere(
                '(LOWER(lead.name) LIKE LOWER(:search) OR LOWER(lead.lastname) LIKE LOWER(:search) OR LOWER(lead.email) LIKE LOWER(:search) OR LOWER(lead.phone) LIKE LOWER(:search) OR LOWER(lead.company_name) LIKE LOWER(:search))',
                { search: `%${query.search}%` }
            );
        }

        // Add status filter
        if (query.status_id) {
            queryBuilder.andWhere('lead.status_id = :status_id', { status_id: query.status_id });
        }

        // Add email contact filter
        if (query.email_contacted !== undefined) {
            queryBuilder.andWhere('lead.email_contacted = :email_contacted', { email_contacted: query.email_contacted });
        }

        // Add customer answered filter
        if (query.customer_answered !== undefined) {
            queryBuilder.andWhere('lead.customer_answered = :customer_answered', { customer_answered: query.customer_answered });
        }

        // Add contacted but no reply filter
        if (query.contacted_no_reply) {
            queryBuilder.andWhere('lead.email_contacted = true AND lead.customer_answered = false');
        }

        // Add awaiting agent reply filter (customer replied but agent hasn't replied back)
        if (query.awaiting_agent_reply) {
            queryBuilder.andWhere('lead.email_contacted = true AND lead.customer_answered = true AND lead.agent_replied_back = false');
        }

        // Add agent replied back filter
        if (query.agent_replied_back !== undefined) {
            queryBuilder.andWhere('lead.agent_replied_back = :agent_replied_back', { agent_replied_back: query.agent_replied_back });
        }

        // Add group filter
        if (query.group_id) {
            queryBuilder.andWhere('lead.group_id = :group_id', { group_id: query.group_id });
        }

        // Add email thread status filter
        if (query.last_email_thread_status) {
            queryBuilder.andWhere('lead.last_email_thread_status = :status', { status: query.last_email_thread_status });
        }

        // Add no email threads filter
        if (query.no_email_threads) {
            queryBuilder.andWhere('lead.email_thread_count = 0');
        }

        // Add has unread threads filter
        if (query.has_unread_threads) {
            queryBuilder.andWhere('lead.email_thread_count > 0 AND lead.last_email_thread_status IS NOT NULL');
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
            relations: ['status', 'tenant', 'group', 'addresses', 'activities', 'emailThreads'],
        });
    }

    async getStats(tenantId: string) {
        const baseQuery = this.leadRepo.createQueryBuilder('lead')
            .where('lead.tenant_id = :tenantId', { tenantId });

        const total_leads = await baseQuery.getCount();

        const contacted_via_email = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true')
            .getCount();

        const customer_responded = await baseQuery
            .clone()
            .andWhere('lead.customer_answered = true')
            .getCount();

        const customer_responded_no_reply = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true AND lead.customer_answered = false')
            .getCount();

        const awaiting_agent_reply = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true AND lead.customer_answered = true AND lead.agent_replied_back = false')
            .getCount();

        const conversation_active = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true AND lead.customer_answered = true AND lead.agent_replied_back = true')
            .getCount();

        const not_contacted = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = false')
            .getCount();

        return {
            total_leads,
            contacted_via_email,
            customer_responded,
            customer_responded_no_reply,
            awaiting_agent_reply,
            conversation_active,
            not_contacted,
        };
    }
}
