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
exports.EmailThreadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const email_thread_entity_1 = require("../../../entities/email/email-thread.entity");
const email_message_entity_1 = require("../../../entities/email/email-message.entity");
const lead_entity_1 = require("../../../entities/leads/lead.entity");
const entity_registry_entity_1 = require("../../../entities/entity-registry/entity-registry.entity");
let EmailThreadService = class EmailThreadService {
    threadRepo;
    messageRepo;
    leadRepo;
    entityRegistryRepo;
    constructor(threadRepo, messageRepo, leadRepo, entityRegistryRepo) {
        this.threadRepo = threadRepo;
        this.messageRepo = messageRepo;
        this.leadRepo = leadRepo;
        this.entityRegistryRepo = entityRegistryRepo;
    }
    async resolveEntityTypeId(entityTypeCode) {
        const entityType = await this.entityRegistryRepo.findOne({
            where: { code: entityTypeCode },
        });
        if (!entityType) {
            throw new common_1.NotFoundException(`Entity type '${entityTypeCode}' not found in registry`);
        }
        return entityType.id;
    }
    async createThread(tenantId, entityTypeId, entityId, emailTo, subject, body, userId) {
        let leadId = null;
        const entityType = await this.entityRegistryRepo.findOne({
            where: { id: entityTypeId },
        });
        if (!entityType) {
            throw new common_1.NotFoundException(`Entity type with ID ${entityTypeId} not found`);
        }
        if (entityType.code === 'lead') {
            const lead = await this.leadRepo.findOne({
                where: { id: parseInt(entityId) },
            });
            if (lead) {
                leadId = lead.id;
            }
        }
        const thread = this.threadRepo.create({
            tenant_id: tenantId,
            entity_type_id: entityTypeId,
            entity_id: entityId,
            lead_id: leadId || undefined,
            subject,
            email_from: 'noreply@example.com',
            email_to: emailTo,
            status: 'draft',
            created_by: userId,
        });
        const savedThread = await this.threadRepo.save(thread);
        const message = this.messageRepo.create({
            tenant_id: tenantId,
            thread_id: savedThread.id,
            message_id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            from_email: 'noreply@example.com',
            to_email: emailTo,
            subject,
            body,
            direction: 'outbound',
            status: 'pending',
        });
        const savedMessage = await this.messageRepo.save(message);
        if (entityType.code === 'lead') {
            await this.leadRepo.update(entityId, {
                email_contacted: true,
                first_email_sent_at: new Date(),
                assigned_rep_id: userId,
            });
        }
        return { thread: savedThread, message: savedMessage };
    }
    async getThreadsByEntity(tenantId, entityTypeId, entityId) {
        const threads = await this.threadRepo.find({
            where: {
                tenant_id: tenantId,
                entity_type_id: entityTypeId,
                entity_id: entityId,
            },
            relations: ['messages', 'entityType'],
            order: { last_message_at: 'DESC' },
        });
        return threads;
    }
    async getThreadDetails(tenantId, threadId) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, tenant_id: tenantId },
            relations: ['messages', 'entityType'],
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        thread.messages = thread.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return thread;
    }
    async updateThreadStatus(tenantId, threadId, status) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, tenant_id: tenantId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        thread.status = status;
        return this.threadRepo.save(thread);
    }
    async markThreadAsRead(tenantId, threadId) {
        const thread = await this.threadRepo.findOne({
            where: { id: threadId, tenant_id: tenantId },
        });
        if (!thread) {
            throw new common_1.NotFoundException('Thread not found');
        }
        thread.is_read = true;
        return this.threadRepo.save(thread);
    }
    async getAllThreads(tenantId, filters) {
        const query = this.threadRepo
            .createQueryBuilder('thread')
            .leftJoinAndSelect('thread.entityType', 'entityType')
            .where('thread.tenant_id = :tenantId', { tenantId });
        if (filters?.entityTypeId) {
            query.andWhere('thread.entity_type_id = :entityTypeId', { entityTypeId: filters.entityTypeId });
        }
        if (filters?.status) {
            query.andWhere('thread.status = :status', { status: filters.status });
        }
        if (filters?.archived === false) {
            query.andWhere('thread.status != :archived', { archived: 'archived' });
        }
        return query.orderBy('thread.last_message_at', 'DESC').getMany();
    }
};
exports.EmailThreadService = EmailThreadService;
exports.EmailThreadService = EmailThreadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(email_thread_entity_1.EmailThread)),
    __param(1, (0, typeorm_1.InjectRepository)(email_message_entity_1.EmailMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(3, (0, typeorm_1.InjectRepository)(entity_registry_entity_1.EntityRegistry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EmailThreadService);
//# sourceMappingURL=email-thread.service.js.map