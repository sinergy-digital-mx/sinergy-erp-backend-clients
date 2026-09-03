import { Repository } from 'typeorm';
import { LeadGroup } from 'src/entities/leads/lead-group.entity';
import { CreateLeadGroupDto } from './dto/create-lead-group.dto';
import { UpdateLeadGroupDto } from './dto/update-lead-group.dto';
export declare class LeadGroupsService {
    private groupRepo;
    constructor(groupRepo: Repository<LeadGroup>);
    create(dto: CreateLeadGroupDto, tenantId: string): Promise<{
        tenant_id: string;
        name: string;
        description?: string;
    } & LeadGroup>;
    findAll(tenantId: string): Promise<LeadGroup[]>;
    findOne(id: string, tenantId: string): Promise<LeadGroup | null>;
    update(id: string, dto: UpdateLeadGroupDto, tenantId: string): Promise<LeadGroup>;
    remove(id: string, tenantId: string): Promise<LeadGroup>;
}
