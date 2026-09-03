import { Repository } from 'typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { PaginatedLeadsDto } from './dto/paginated-leads.dto';
import { LeadStatus } from 'src/entities/leads/lead-status.entity';
import { Lead } from 'src/entities/leads/lead.entity';
export declare class LeadsService {
    private leadRepo;
    private statusRepo;
    constructor(leadRepo: Repository<Lead>, statusRepo: Repository<LeadStatus>);
    create(dto: CreateLeadDto, tenantId: string): Promise<{
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
    } & Lead>;
    update(id: number, dto: UpdateLeadDto, tenantId: string): Promise<Lead>;
    findAll(tenantId: string, query: QueryLeadsDto): Promise<PaginatedLeadsDto>;
    findOne(id: number, tenantId: string): Promise<Lead | null>;
    getStats(tenantId: string): Promise<{
        total_leads: number;
        contacted_via_email: number;
        customer_responded: number;
        customer_responded_no_reply: number;
        awaiting_agent_reply: number;
        conversation_active: number;
        not_contacted: number;
    }>;
}
