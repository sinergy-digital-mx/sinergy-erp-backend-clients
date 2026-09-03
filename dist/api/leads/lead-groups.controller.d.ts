import { LeadGroupsService } from './lead-groups.service';
import { CreateLeadGroupDto } from './dto/create-lead-group.dto';
import { UpdateLeadGroupDto } from './dto/update-lead-group.dto';
export declare class LeadGroupsController {
    private readonly groupsService;
    constructor(groupsService: LeadGroupsService);
    create(dto: CreateLeadGroupDto, req: any): Promise<{
        tenant_id: string;
        name: string;
        description?: string;
    } & import("../../entities/leads/lead-group.entity").LeadGroup>;
    findAll(req: any): Promise<import("../../entities/leads/lead-group.entity").LeadGroup[]>;
    findOne(id: string, req: any): Promise<import("../../entities/leads/lead-group.entity").LeadGroup | null>;
    update(id: string, dto: UpdateLeadGroupDto, req: any): Promise<import("../../entities/leads/lead-group.entity").LeadGroup>;
    remove(id: string, req: any): Promise<import("../../entities/leads/lead-group.entity").LeadGroup>;
}
