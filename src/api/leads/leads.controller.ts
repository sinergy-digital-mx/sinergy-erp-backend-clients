// src/api/leads/leads.controller.ts
import {
    Controller,
    Post,
    Put,
    Get,
    Body,
    Param,
    Req,
    UseGuards,
    Delete,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { PaginatedLeadsDto } from './dto/paginated-leads.dto';
import { LeadsStatsDto } from './dto/leads-stats.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('leads')
@ApiTags('Leads')
@ApiBearerAuth()
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    @RequirePermissions({ entityType: 'leads', action: 'Create' })
    @ApiOperation({ summary: 'Create a new lead' })
    @ApiBody({ type: CreateLeadDto })
    @ApiResponse({ status: 201, description: 'Lead created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    create(@Body() dto: CreateLeadDto, @Req() req: any) {
        return this.leadsService.create(dto, req.user.tenantId);
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'leads', action: 'Update' })
    @ApiOperation({ summary: 'Update an existing lead' })
    @ApiParam({ name: 'id', type: 'number', description: 'Lead ID' })
    @ApiBody({ type: UpdateLeadDto })
    @ApiResponse({ status: 200, description: 'Lead updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto, @Req() req: any) {
        return this.leadsService.update(id, dto, req.user.tenantId);
    }

    @Get('debug')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Debug endpoint to test JWT authentication' })
    @ApiResponse({ status: 200, description: 'Debug info returned successfully' })
    debugAuth(@Req() req: any) {
        return {
            message: 'JWT Auth working',
            user: req.user,
            timestamp: new Date().toISOString()
        };
    }

    @Get('stats/overview')
    @RequirePermissions({ entityType: 'leads', action: 'Read' })
    @ApiOperation({ summary: 'Get leads statistics overview' })
    @ApiResponse({ status: 200, description: 'Leads statistics retrieved successfully', type: LeadsStatsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    getStats(@Req() req: any) {
        return this.leadsService.getStats(req.user.tenantId);
    }

    @Get()
    @RequirePermissions({ entityType: 'leads', action: 'Read' })
    @ApiOperation({ summary: 'Get paginated leads with search functionality' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 20 })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, email, phone, or company' })
    @ApiQuery({ name: 'status_id', required: false, type: Number, description: 'Filter by status ID' })
    @ApiQuery({ name: 'email_contacted', required: false, type: Boolean, description: 'Filter by email contact status' })
    @ApiQuery({ name: 'customer_answered', required: false, type: Boolean, description: 'Filter by customer response status' })
    @ApiQuery({ name: 'contacted_no_reply', required: false, type: Boolean, description: 'Filter for leads contacted but customer has not replied' })
    @ApiQuery({ name: 'awaiting_agent_reply', required: false, type: Boolean, description: 'Filter for leads where customer replied but agent has not replied back' })
    @ApiQuery({ name: 'agent_replied_back', required: false, type: Boolean, description: 'Filter by agent reply status' })
    @ApiResponse({ status: 200, description: 'Paginated list of leads retrieved successfully', type: PaginatedLeadsDto })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findAll(@Query() query: QueryLeadsDto, @Req() req: any) {
        return this.leadsService.findAll(req.user.tenantId, query);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'leads', action: 'Read' })
    @ApiOperation({ summary: 'Get a specific lead by ID with addresses and activities' })
    @ApiParam({ name: 'id', type: 'number', description: 'Lead ID' })
    @ApiResponse({ status: 200, description: 'Lead with addresses and activities retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.leadsService.findOne(id, req.user.tenantId);
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'leads', action: 'Delete' })
    @ApiOperation({ summary: 'Delete a lead by ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Lead ID' })
    @ApiResponse({ status: 200, description: 'Lead deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    @ApiResponse({ status: 501, description: 'Not implemented - Delete functionality not yet available' })
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        // Note: This assumes you'll add a remove method to LeadsService
        // return this.leadsService.remove(id, req.user.tenantId);
        throw new Error('Delete functionality not yet implemented in service');
    }
}
