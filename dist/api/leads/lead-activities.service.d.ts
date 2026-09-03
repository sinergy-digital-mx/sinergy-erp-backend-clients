import { Repository } from 'typeorm';
import { LeadActivity } from '../../entities/leads/lead-activity.entity';
import { Lead } from '../../entities/leads/lead.entity';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { QueryLeadActivityDto } from './dto/query-lead-activity.dto';
export declare class LeadActivitiesService {
    private activityRepo;
    private leadRepo;
    constructor(activityRepo: Repository<LeadActivity>, leadRepo: Repository<Lead>);
    create(leadId: number, dto: CreateLeadActivityDto, userId: string, tenantId: string): Promise<LeadActivity>;
    findAll(leadId: number, query: QueryLeadActivityDto, tenantId: string): Promise<{
        activities: LeadActivity[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(leadId: number, activityId: string, tenantId: string): Promise<LeadActivity>;
    update(leadId: number, activityId: string, dto: UpdateLeadActivityDto, userId: string, tenantId: string): Promise<LeadActivity>;
    remove(leadId: number, activityId: string, userId: string, tenantId: string): Promise<void>;
    getActivitySummary(leadId: number, tenantId: string): Promise<{
        total_activities: number;
        activities_by_type: Record<string, number>;
        activities_by_status: Record<string, number>;
        last_activity_date: Date | null;
        next_follow_up: Date | null;
    }>;
}
