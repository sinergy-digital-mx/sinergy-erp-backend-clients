import { CustomerActivityStatus, CustomerActivityType } from '../../../entities/customers/customer-activity.entity';
export declare enum CrmReportPeriod {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    YEAR = "year",
    RANGE = "range"
}
export declare enum CrmAttentionFilter {
    FOLLOW_UP_PENDING = "follow_up_pending",
    FOLLOW_UP_OVERDUE = "follow_up_overdue",
    CALL_PENDING = "call_pending",
    TASK_PENDING = "task_pending"
}
export declare class QueryCrmActivityDto {
    page?: number;
    limit?: number;
    search?: string;
    type?: CustomerActivityType;
    status?: CustomerActivityStatus;
    user_id?: string;
    period?: CrmReportPeriod;
    date_from?: string;
    date_to?: string;
    attention?: CrmAttentionFilter;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
}
