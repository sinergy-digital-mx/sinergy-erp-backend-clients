import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { PaginatedLeadsDto } from './dto/paginated-leads.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(dto: CreateLeadDto, req: any): Promise<{
        tenant: {
            id: string;
        };
        tenant_id: string;
        status: any;
        status_id: number;
        name: string;
        lastname: string;
        email: string;
        phone: string;
        phone_country: string;
        phone_code: string;
        source?: string;
        company_name?: string;
        company_phone?: string;
        website?: string;
        group_id?: string;
    } & import("../../entities/leads/lead.entity").Lead>;
    update(id: number, dto: UpdateLeadDto, req: any): Promise<import("../../entities/leads/lead.entity").Lead>;
    debugAuth(req: any): {
        message: string;
        user: any;
        timestamp: string;
    };
    getStats(req: any): Promise<{
        total_leads: number;
        contacted_via_email: number;
        customer_responded: number;
        customer_responded_no_reply: number;
        awaiting_agent_reply: number;
        conversation_active: number;
        not_contacted: number;
    }>;
    findAll(query: QueryLeadsDto, req: any): Promise<PaginatedLeadsDto>;
    findOne(id: number, req: any): Promise<import("../../entities/leads/lead.entity").Lead | null>;
    remove(id: number, req: any): void;
}
