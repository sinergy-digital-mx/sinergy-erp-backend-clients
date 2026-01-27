// src/api/leads/lead-activities.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
    ParseUUIDPipe,
} from '@nestjs/common';
import { LeadActivitiesService } from './lead-activities.service';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { QueryLeadActivityDto } from './dto/query-lead-activity.dto';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leads/:leadId/activities')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LeadActivitiesController {
    constructor(private readonly activitiesService: LeadActivitiesService) {}

    @Post()
    @RequirePermissions({ entityType: 'Lead', action: 'Update' }, { entityType: 'Activity', action: 'Create' })
    async create(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Body() createActivityDto: CreateLeadActivityDto,
        @Request() req: any,
    ) {
        return this.activitiesService.create(
            leadId,
            createActivityDto,
            req.user.id,
            req.user.tenantId,
        );
    }

    @Get()
    @RequirePermissions({ entityType: 'Lead', action: 'Read' }, { entityType: 'Activity', action: 'Read' })
    async findAll(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Query() query: QueryLeadActivityDto,
        @Request() req: any,
    ) {
        return this.activitiesService.findAll(leadId, query, req.user.tenantId);
    }

    @Get('summary')
    @RequirePermissions({ entityType: 'Lead', action: 'Read' }, { entityType: 'Activity', action: 'Read' })
    async getActivitySummary(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Request() req: any,
    ) {
        return this.activitiesService.getActivitySummary(leadId, req.user.tenantId);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Read' }, { entityType: 'Activity', action: 'Read' })
    async findOne(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ) {
        return this.activitiesService.findOne(leadId, id, req.user.tenantId);
    }

    @Patch(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Update' }, { entityType: 'Activity', action: 'Update' })
    async update(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateActivityDto: UpdateLeadActivityDto,
        @Request() req: any,
    ) {
        return this.activitiesService.update(
            leadId,
            id,
            updateActivityDto,
            req.user.id,
            req.user.tenantId,
        );
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Delete' }, { entityType: 'Activity', action: 'Delete' })
    async remove(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ) {
        await this.activitiesService.remove(leadId, id, req.user.id, req.user.tenantId);
        return { message: 'Activity deleted successfully' };
    }
}