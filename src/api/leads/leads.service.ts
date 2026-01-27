// src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { Lead } from 'src/entities/leads/lead.entity';
import { Tenant } from 'src/entities/tenant/tenant.entity';

@Injectable()
export class LeadsService {
    constructor(
        @InjectRepository(Lead) private leadRepo: Repository<Lead>,
        @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
        @InjectRepository(LeadStatus) private statusRepo: Repository<LeadStatus>,
    ) { }

    async create(dto: CreateLeadDto) {
        const tenant = await this.tenantRepo.findOneByOrFail({ id: dto.tenant_id });
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });

        return this.leadRepo.save({
            ...dto,
            tenant,
            status,
        });
    }

    async update(id: number, dto: UpdateLeadDto) {
        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            await this.leadRepo.update(id, { ...dto, status });
            return this.findOne(id);
        }

        await this.leadRepo.update(id, dto);
        return this.findOne(id);
    }

    findAll() {
        return this.leadRepo.find({ relations: ['tenant', 'status'] });
    }

    findOne(id: number) {
        return this.leadRepo.findOne({
            where: { id },
            relations: ['tenant', 'status'],
        });
    }
}
