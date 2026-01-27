// src/api/leads/lead-activities.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { LeadActivity } from '../../entities/leads/lead-activity.entity';
import { Lead } from '../../entities/leads/lead.entity';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { QueryLeadActivityDto } from './dto/query-lead-activity.dto';

@Injectable()
export class LeadActivitiesService {
    constructor(
        @InjectRepository(LeadActivity)
        private activityRepo: Repository<LeadActivity>,
        @InjectRepository(Lead)
        private leadRepo: Repository<Lead>,
    ) {}

    async create(
        leadId: number,
        dto: CreateLeadActivityDto,
        userId: string,
        tenantId: string,
    ): Promise<LeadActivity> {
        // Verify lead exists and belongs to tenant
        const lead = await this.leadRepo.findOne({
            where: { id: leadId, tenant_id: tenantId },
        });

        if (!lead) {
            throw new NotFoundException(`Lead with ID ${leadId} not found`);
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
            lead_id: leadId,
            user_id: userId,
            tenant_id: tenantId,
            activity_date: new Date(), // Auto-generated current timestamp in UTC
            follow_up_date: dto.follow_up_date ? new Date(dto.follow_up_date) : undefined,
        });

        return this.activityRepo.save(activity);
    }

    async findAll(
        leadId: number,
        query: QueryLeadActivityDto,
        tenantId: string,
    ): Promise<{ activities: LeadActivity[]; total: number; page: number; totalPages: number }> {
        // Set defaults for pagination
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortBy = query.sort_by || 'activity_date';
        const sortOrder = query.sort_order || 'DESC';
        // Verify lead exists and belongs to tenant
        const lead = await this.leadRepo.findOne({
            where: { id: leadId, tenant_id: tenantId },
        });

        if (!lead) {
            throw new NotFoundException(`Lead with ID ${leadId} not found`);
        }

        const where: FindOptionsWhere<LeadActivity> = {
            lead_id: leadId,
            tenant_id: tenantId,
        };

        // Apply filters
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

        // Date range filter
        if (query.from_date || query.to_date) {
            const fromDate = query.from_date ? new Date(query.from_date) : new Date('1900-01-01');
            const toDate = query.to_date ? new Date(query.to_date) : new Date('2100-12-31');
            where.activity_date = Between(fromDate, toDate);
        }

        const [activities, total] = await this.activityRepo.findAndCount({
            where,
            relations: ['user', 'lead'],
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

    async findOne(
        leadId: number,
        activityId: string,
        tenantId: string,
    ): Promise<LeadActivity> {
        const activity = await this.activityRepo.findOne({
            where: {
                id: activityId,
                lead_id: leadId,
                tenant_id: tenantId,
            },
            relations: ['user', 'lead'],
        });

        if (!activity) {
            throw new NotFoundException(`Activity with ID ${activityId} not found`);
        }

        return activity;
    }

    async update(
        leadId: number,
        activityId: string,
        dto: UpdateLeadActivityDto,
        userId: string,
        tenantId: string,
    ): Promise<LeadActivity> {
        const activity = await this.findOne(leadId, activityId, tenantId);

        // Check if user can update this activity (owner or admin)
        if (activity.user_id !== userId) {
            // Here you could add additional permission checks
            // For now, we'll allow any authenticated user in the same tenant
        }

        const updateData: Partial<LeadActivity> = {};
        
        if (dto.type !== undefined) updateData.type = dto.type;
        if (dto.status !== undefined) updateData.status = dto.status;
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.duration_minutes !== undefined) updateData.duration_minutes = dto.duration_minutes;
        if (dto.outcome !== undefined) updateData.outcome = dto.outcome;
        if (dto.notes !== undefined) updateData.notes = dto.notes;
        if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
        // Note: activity_date is not updatable - it's set automatically when created
        if (dto.follow_up_date !== undefined) updateData.follow_up_date = new Date(dto.follow_up_date);

        await this.activityRepo.update(activityId, updateData);
        return this.findOne(leadId, activityId, tenantId);
    }

    async remove(
        leadId: number,
        activityId: string,
        userId: string,
        tenantId: string,
    ): Promise<void> {
        const activity = await this.findOne(leadId, activityId, tenantId);

        // Check if user can delete this activity (owner or admin)
        if (activity.user_id !== userId) {
            // Here you could add additional permission checks
            // For now, we'll allow any authenticated user in the same tenant
        }

        await this.activityRepo.remove(activity);
    }

    async getActivitySummary(
        leadId: number,
        tenantId: string,
    ): Promise<{
        total_activities: number;
        activities_by_type: Record<string, number>;
        activities_by_status: Record<string, number>;
        last_activity_date: Date | null;
        next_follow_up: Date | null;
    }> {
        // Verify lead exists and belongs to tenant
        const lead = await this.leadRepo.findOne({
            where: { id: leadId, tenant_id: tenantId },
        });

        if (!lead) {
            throw new NotFoundException(`Lead with ID ${leadId} not found`);
        }

        const activities = await this.activityRepo.find({
            where: { lead_id: leadId, tenant_id: tenantId },
            order: { activity_date: 'DESC' },
        });

        const total_activities = activities.length;
        
        const activities_by_type = activities.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const activities_by_status = activities.reduce((acc, activity) => {
            acc[activity.status] = (acc[activity.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const last_activity_date = activities.length > 0 ? activities[0].activity_date : null;

        const upcomingFollowUps = activities
            .filter(a => a.follow_up_date && a.follow_up_date > new Date())
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
}