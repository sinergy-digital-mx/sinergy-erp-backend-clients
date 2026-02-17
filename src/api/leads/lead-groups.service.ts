import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadGroup } from 'src/entities/leads/lead-group.entity';
import { CreateLeadGroupDto } from './dto/create-lead-group.dto';
import { UpdateLeadGroupDto } from './dto/update-lead-group.dto';

@Injectable()
export class LeadGroupsService {
    constructor(
        @InjectRepository(LeadGroup) private groupRepo: Repository<LeadGroup>,
    ) { }

    async create(dto: CreateLeadGroupDto, tenantId: string) {
        return this.groupRepo.save({
            ...dto,
            tenant_id: tenantId,
        });
    }

    async findAll(tenantId: string) {
        return this.groupRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string, tenantId: string) {
        return this.groupRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['leads'],
        });
    }

    async update(id: string, dto: UpdateLeadGroupDto, tenantId: string) {
        const group = await this.groupRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });

        Object.assign(group, dto);
        return this.groupRepo.save(group);
    }

    async remove(id: string, tenantId: string) {
        const group = await this.groupRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });

        return this.groupRepo.remove(group);
    }
}
