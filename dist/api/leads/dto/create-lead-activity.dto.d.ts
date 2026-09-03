import { ActivityType, ActivityStatus } from '../../../entities/leads/lead-activity.entity';
export declare class CreateLeadActivityDto {
    type: ActivityType;
    status?: ActivityStatus;
    title: string;
    description: string;
    duration_minutes?: number;
    outcome?: string;
    follow_up_date?: string;
    notes: string;
    metadata?: Record<string, any>;
}
