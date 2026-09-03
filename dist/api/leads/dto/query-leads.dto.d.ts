export declare class QueryLeadsDto {
    page?: number;
    limit?: number;
    search?: string;
    status_id?: number;
    email_contacted?: boolean;
    customer_answered?: boolean;
    contacted_no_reply?: boolean;
    awaiting_agent_reply?: boolean;
    agent_replied_back?: boolean;
    group_id?: string;
    last_email_thread_status?: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';
    no_email_threads?: boolean;
    has_unread_threads?: boolean;
}
