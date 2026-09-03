import { LeadActivitiesService } from './lead-activities.service';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { QueryLeadActivityDto } from './dto/query-lead-activity.dto';
export declare class LeadActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: LeadActivitiesService);
    create(leadId: number, createActivityDto: CreateLeadActivityDto, req: any): Promise<import("../../entities/leads/lead-activity.entity").LeadActivity>;
    findAll(leadId: number, query: QueryLeadActivityDto, req: any): Promise<{
        activities: import("../../entities/leads/lead-activity.entity").LeadActivity[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getActivitySummary(leadId: number, req: any): Promise<{
        total_activities: number;
        activities_by_type: Record<string, number>;
        activities_by_status: Record<string, number>;
        last_activity_date: Date | null;
        next_follow_up: Date | null;
    }>;
    findOne(leadId: number, id: string, req: any): Promise<import("../../entities/leads/lead-activity.entity").LeadActivity>;
    update(leadId: number, id: string, updateActivityDto: UpdateLeadActivityDto, req: any): Promise<import("../../entities/leads/lead-activity.entity").LeadActivity>;
    remove(leadId: number, id: string, req: any): Promise<{
        message: string;
    }>;
}
