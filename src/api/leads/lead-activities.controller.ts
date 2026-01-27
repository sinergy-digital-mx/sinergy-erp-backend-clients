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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadActivitiesService } from './lead-activities.service';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { UpdateLeadActivityDto } from './dto/update-lead-activity.dto';
import { QueryLeadActivityDto } from './dto/query-lead-activity.dto';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('leads/:leadId/activities')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiTags('Lead Activities')
@ApiBearerAuth()
export class LeadActivitiesController {
    constructor(private readonly activitiesService: LeadActivitiesService) {}

    @Post()
    @RequirePermissions({ entityType: 'Lead', action: 'Activity:Create' })
    @ApiOperation({ summary: 'Create a new lead activity' })
    @ApiParam({ name: 'leadId', type: 'number', description: 'Lead ID' })
    @ApiBody({ type: CreateLeadActivityDto })
    @ApiResponse({ status: 201, description: 'Lead activity created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
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
    @RequirePermissions({ entityType: 'Lead', action: 'Activity:Read' })
    @ApiOperation({ summary: 'Get all activities for a lead' })
    @ApiParam({ name: 'leadId', type: 'number', description: 'Lead ID' })
    @ApiQuery({ type: QueryLeadActivityDto, required: false })
    @ApiResponse({ status: 200, description: 'List of lead activities retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    async findAll(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Query() query: QueryLeadActivityDto,
        @Request() req: any,
    ) {
        return this.activitiesService.findAll(leadId, query, req.user.tenantId);
    }

    @Get('summary')
    @RequirePermissions({ entityType: 'Lead', action: 'Activity:Read' })
    @ApiOperation({ summary: 'Get activity summary for a lead' })
    @ApiParam({ name: 'leadId', type: 'number', description: 'Lead ID' })
    @ApiResponse({ status: 200, description: 'Lead activity summary retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    async getActivitySummary(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Request() req: any,
    ) {
        return this.activitiesService.getActivitySummary(leadId, req.user.tenantId);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Activity:Read' })
    @ApiOperation({ summary: 'Get a specific lead activity by ID' })
    @ApiParam({ name: 'leadId', type: 'number', description: 'Lead ID' })
    @ApiParam({ name: 'id', type: 'string', description: 'Activity ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Lead activity retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead or activity does not exist' })
    async findOne(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ) {
        return this.activitiesService.findOne(leadId, id, req.user.tenantId);
    }

    @Patch(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Activity:Update' })
    @ApiOperation({ summary: 'Update a lead activity' })
    @ApiParam({ name: 'leadId', type: 'number', description: 'Lead ID' })
    @ApiParam({ name: 'id', type: 'string', description: 'Activity ID (UUID)' })
    @ApiBody({ type: UpdateLeadActivityDto })
    @ApiResponse({ status: 200, description: 'Lead activity updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead or activity does not exist' })
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
    @RequirePermissions({ entityType: 'Lead', action: 'Activity:Delete' })
    @ApiOperation({ summary: 'Delete a lead activity' })
    @ApiParam({ name: 'leadId', type: 'number', description: 'Lead ID' })
    @ApiParam({ name: 'id', type: 'string', description: 'Activity ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Lead activity deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead or activity does not exist' })
    async remove(
        @Param('leadId', ParseIntPipe) leadId: number,
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: any,
    ) {
        await this.activitiesService.remove(leadId, id, req.user.id, req.user.tenantId);
        return { message: 'Activity deleted successfully' };
    }
}