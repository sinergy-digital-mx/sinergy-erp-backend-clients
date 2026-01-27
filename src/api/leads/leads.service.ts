// src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
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

    findAll(tenantId: string) {
        return this.leadRepo.find({
            where: { tenant_id: tenantId },
            relations: ['status', 'tenant'],
        });
    }

    findOne(id: number, tenantId: string) {
        return this.leadRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'tenant'],
        });
    }
}
