import { ActivityType, ActivityStatus } from '../../../entities/leads/lead-activity.entity';
export declare class QueryLeadActivityDto {
    type?: ActivityType;
    status?: ActivityStatus;
    from_date?: string;
    to_date?: string;
    user_id?: string;
    outcome?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
