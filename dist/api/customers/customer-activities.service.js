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
exports.CustomerActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_activity_entity_1 = require("../../entities/customers/customer-activity.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
let CustomerActivitiesService = class CustomerActivitiesService {
    activityRepo;
    customerRepo;
    constructor(activityRepo, customerRepo) {
        this.activityRepo = activityRepo;
        this.customerRepo = customerRepo;
    }
    async create(customerId, dto, userId, tenantId) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${customerId} not found`);
        }
        const activity = this.activityRepo.create({
            type: dto.type,
            status: dto.status,
            title: dto.title,
            description: dto.description,
            notes: dto.notes,
            duration_minutes: dto.duration_minutes,
            outcome: dto.outcome,
            metadata: dto.metadata,
            customer_id: customerId,
            user_id: userId,
            tenant_id: tenantId,
            activity_date: new Date(),
            follow_up_date: dto.follow_up_date ? new Date(dto.follow_up_date) : undefined,
        });
        return this.activityRepo.save(activity);
    }
    async findAll(customerId, query, tenantId) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortBy = query.sort_by || 'activity_date';
        const sortOrder = query.sort_order || 'DESC';
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${customerId} not found`);
        }
        const where = {
            customer_id: customerId,
            tenant_id: tenantId,
        };
        if (query.type) {
            where.type = query.type;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.user_id) {
            where.user_id = query.user_id;
        }
        if (query.outcome) {
            where.outcome = query.outcome;
        }
        if (query.from_date || query.to_date) {
            const fromDate = query.from_date ? new Date(query.from_date) : new Date('1900-01-01');
            const toDate = query.to_date ? new Date(query.to_date) : new Date('2100-12-31');
            where.activity_date = (0, typeorm_2.Between)(fromDate, toDate);
        }
        const [activities, total] = await this.activityRepo.findAndCount({
            where,
            relations: ['user', 'customer'],
            order: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
        });
        const totalPages = Math.ceil(total / limit);
        return {
            activities,
            total,
            page,
            totalPages,
        };
    }
    async findOne(customerId, activityId, tenantId) {
        const activity = await this.activityRepo.findOne({
            where: {
                id: activityId,
                customer_id: customerId,
                tenant_id: tenantId,
            },
            relations: ['user', 'customer'],
        });
        if (!activity) {
            throw new common_1.NotFoundException(`Activity with ID ${activityId} not found`);
        }
        return activity;
    }
    async update(customerId, activityId, dto, userId, tenantId) {
        const activity = await this.findOne(customerId, activityId, tenantId);
        const updateData = {};
        if (dto.type !== undefined)
            updateData.type = dto.type;
        if (dto.status !== undefined)
            updateData.status = dto.status;
        if (dto.title !== undefined)
            updateData.title = dto.title;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.duration_minutes !== undefined)
            updateData.duration_minutes = dto.duration_minutes;
        if (dto.outcome !== undefined)
            updateData.outcome = dto.outcome;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        if (dto.metadata !== undefined)
            updateData.metadata = dto.metadata;
        if (dto.follow_up_date !== undefined)
            updateData.follow_up_date = new Date(dto.follow_up_date);
        await this.activityRepo.update(activityId, updateData);
        return this.findOne(customerId, activityId, tenantId);
    }
    async remove(customerId, activityId, userId, tenantId) {
        const activity = await this.findOne(customerId, activityId, tenantId);
        await this.activityRepo.remove(activity);
    }
    async getActivitySummary(customerId, tenantId) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
        });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with ID ${customerId} not found`);
        }
        const activities = await this.activityRepo.find({
            where: { customer_id: customerId, tenant_id: tenantId },
            order: { activity_date: 'DESC' },
        });
        const total_activities = activities.length;
        const activities_by_type = activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
        }, {});
        const activities_by_status = activities.reduce((acc, activity) => {
            acc[activity.status] = (acc[activity.status] || 0) + 1;
            return acc;
        }, {});
        const last_activity_date = activities.length > 0 ? activities[0].activity_date : null;
        const upcomingFollowUps = activities
            .filter((a) => a.follow_up_date && a.follow_up_date > new Date())
            .sort((a, b) => a.follow_up_date.getTime() - b.follow_up_date.getTime());
        const next_follow_up = upcomingFollowUps.length > 0 ? upcomingFollowUps[0].follow_up_date : null;
        return {
            total_activities,
            activities_by_type,
            activities_by_status,
            last_activity_date,
            next_follow_up,
        };
    }
};
exports.CustomerActivitiesService = CustomerActivitiesService;
exports.CustomerActivitiesService = CustomerActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_activity_entity_1.CustomerActivity)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomerActivitiesService);
//# sourceMappingURL=customer-activities.service.js.map