"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lead_status_entity_1 = require("../../entities/leads/lead-status.entity");
const lead_entity_1 = require("../../entities/leads/lead.entity");
let LeadsService = class LeadsService {
    leadRepo;
    statusRepo;
    constructor(leadRepo, statusRepo) {
        this.leadRepo = leadRepo;
        this.statusRepo = statusRepo;
    }
    async create(dto, tenantId) {
        let status;
        if (dto.status_id) {
            status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
        }
        else {
            status = await this.statusRepo.findOneBy({ code: 'new' });
            if (!status) {
                status = await this.statusRepo.findOne({});
            }
        }
        return this.leadRepo.save({
            ...dto,
            tenant: { id: tenantId },
            tenant_id: tenantId,
            status,
        });
    }
    async update(id, dto, tenantId) {
        const lead = await this.leadRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });
        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            lead.status = status;
        }
        Object.assign(lead, dto);
        return this.leadRepo.save(lead);
    }
    async findAll(tenantId, query) {
        let page = Number(query.page) || 1;
        let limit = Number(query.limit) || 20;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const queryBuilder = this.leadRepo.createQueryBuilder('lead')
            .leftJoinAndSelect('lead.status', 'status')
            .leftJoinAndSelect('lead.tenant', 'tenant')
            .leftJoinAndSelect('lead.group', 'group')
            .where('lead.tenant_id = :tenantId', { tenantId });
        if (query.search) {
            queryBuilder.andWhere('(LOWER(lead.name) LIKE LOWER(:search) OR LOWER(lead.lastname) LIKE LOWER(:search) OR LOWER(lead.email) LIKE LOWER(:search) OR LOWER(lead.phone) LIKE LOWER(:search) OR LOWER(lead.company_name) LIKE LOWER(:search))', { search: `%${query.search}%` });
        }
        if (query.status_id) {
            queryBuilder.andWhere('lead.status_id = :status_id', { status_id: query.status_id });
        }
        if (query.email_contacted !== undefined) {
            queryBuilder.andWhere('lead.email_contacted = :email_contacted', { email_contacted: query.email_contacted });
        }
        if (query.customer_answered !== undefined) {
            queryBuilder.andWhere('lead.customer_answered = :customer_answered', { customer_answered: query.customer_answered });
        }
        if (query.contacted_no_reply) {
            queryBuilder.andWhere('lead.email_contacted = true AND lead.customer_answered = false');
        }
        if (query.awaiting_agent_reply) {
            queryBuilder.andWhere('lead.email_contacted = true AND lead.customer_answered = true AND lead.agent_replied_back = false');
        }
        if (query.agent_replied_back !== undefined) {
            queryBuilder.andWhere('lead.agent_replied_back = :agent_replied_back', { agent_replied_back: query.agent_replied_back });
        }
        if (query.group_id) {
            queryBuilder.andWhere('lead.group_id = :group_id', { group_id: query.group_id });
        }
        if (query.last_email_thread_status) {
            queryBuilder.andWhere('lead.last_email_thread_status = :status', { status: query.last_email_thread_status });
        }
        if (query.no_email_threads) {
            queryBuilder.andWhere('lead.email_thread_count = 0');
        }
        if (query.has_unread_threads) {
            queryBuilder.andWhere('lead.email_thread_count > 0 AND lead.last_email_thread_status IS NOT NULL');
        }
        queryBuilder.orderBy('lead.created_at', 'DESC');
        const total = await queryBuilder.getCount();
        const leads = await queryBuilder
            .skip(skip)
            .take(limit)
            .getMany();
        const totalPages = Math.ceil(total / limit);
        return {
            data: leads,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    findOne(id, tenantId) {
        return this.leadRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'tenant', 'group', 'addresses', 'activities', 'emailThreads'],
        });
    }
    async getStats(tenantId) {
        const baseQuery = this.leadRepo.createQueryBuilder('lead')
            .where('lead.tenant_id = :tenantId', { tenantId });
        const total_leads = await baseQuery.getCount();
        const contacted_via_email = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true')
            .getCount();
        const customer_responded = await baseQuery
            .clone()
            .andWhere('lead.customer_answered = true')
            .getCount();
        const customer_responded_no_reply = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true AND lead.customer_answered = false')
            .getCount();
        const awaiting_agent_reply = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true AND lead.customer_answered = true AND lead.agent_replied_back = false')
            .getCount();
        const conversation_active = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = true AND lead.customer_answered = true AND lead.agent_replied_back = true')
            .getCount();
        const not_contacted = await baseQuery
            .clone()
            .andWhere('lead.email_contacted = false')
            .getCount();
        return {
            total_leads,
            contacted_via_email,
            customer_responded,
            customer_responded_no_reply,
            awaiting_agent_reply,
            conversation_active,
            not_contacted,
        };
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(1, (0, typeorm_1.InjectRepository)(lead_status_entity_1.LeadStatus)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LeadsService);
//# sourceMappingURL=leads.service.js.map