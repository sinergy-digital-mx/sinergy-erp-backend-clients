import { Lead } from '../../../entities/leads/lead.entity';
export declare class PaginatedLeadsDto {
    data: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
