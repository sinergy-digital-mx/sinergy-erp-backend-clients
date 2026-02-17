import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { CustomerActivity } from '../../entities/customers/customer-activity.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CreateCustomerActivityDto } from './dto/create-customer-activity.dto';
import { UpdateCustomerActivityDto } from './dto/update-customer-activity.dto';
import { QueryCustomerActivityDto } from './dto/query-customer-activity.dto';

@Injectable()
export class CustomerActivitiesService {
  constructor(
    @InjectRepository(CustomerActivity)
    private activityRepo: Repository<CustomerActivity>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async create(
    customerId: number,
    dto: CreateCustomerActivityDto,
    userId: string,
    tenantId: string,
  ): Promise<CustomerActivity> {
    // Verify customer exists and belongs to tenant
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
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

  async findAll(
    customerId: number,
    query: QueryCustomerActivityDto,
    tenantId: string,
  ): Promise<{ activities: CustomerActivity[]; total: number; page: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sort_by || 'activity_date';
    const sortOrder = query.sort_order || 'DESC';

    // Verify customer exists and belongs to tenant
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const where: FindOptionsWhere<CustomerActivity> = {
      customer_id: customerId,
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

  async findOne(
    customerId: number,
    activityId: string,
    tenantId: string,
  ): Promise<CustomerActivity> {
    const activity = await this.activityRepo.findOne({
      where: {
        id: activityId,
        customer_id: customerId,
        tenant_id: tenantId,
      },
      relations: ['user', 'customer'],
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    return activity;
  }

  async update(
    customerId: number,
    activityId: string,
    dto: UpdateCustomerActivityDto,
    userId: string,
    tenantId: string,
  ): Promise<CustomerActivity> {
    const activity = await this.findOne(customerId, activityId, tenantId);

    const updateData: Partial<CustomerActivity> = {};

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.duration_minutes !== undefined) updateData.duration_minutes = dto.duration_minutes;
    if (dto.outcome !== undefined) updateData.outcome = dto.outcome;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;
    if (dto.follow_up_date !== undefined) updateData.follow_up_date = new Date(dto.follow_up_date);

    await this.activityRepo.update(activityId, updateData);
    return this.findOne(customerId, activityId, tenantId);
  }

  async remove(
    customerId: number,
    activityId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const activity = await this.findOne(customerId, activityId, tenantId);
    await this.activityRepo.remove(activity);
  }

  async getActivitySummary(
    customerId: number,
    tenantId: string,
  ): Promise<{
    total_activities: number;
    activities_by_type: Record<string, number>;
    activities_by_status: Record<string, number>;
    last_activity_date: Date | null;
    next_follow_up: Date | null;
  }> {
    // Verify customer exists and belongs to tenant
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, tenant_id: tenantId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const activities = await this.activityRepo.find({
      where: { customer_id: customerId, tenant_id: tenantId },
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
}
