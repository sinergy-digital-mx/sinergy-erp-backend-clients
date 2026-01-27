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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
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
    @RequirePermissions({ entityType: 'Lead', action: 'Create' })
    @ApiOperation({ summary: 'Create a new lead' })
    @ApiBody({ type: CreateLeadDto })
    @ApiResponse({ status: 201, description: 'Lead created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    create(@Body() dto: CreateLeadDto, @Req() req) {
        return this.leadsService.create(dto, req.user.tenantId);
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Update' })
    @ApiOperation({ summary: 'Update an existing lead' })
    @ApiParam({ name: 'id', type: 'number', description: 'Lead ID' })
    @ApiBody({ type: UpdateLeadDto })
    @ApiResponse({ status: 200, description: 'Lead updated successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto, @Req() req) {
        return this.leadsService.update(id, dto, req.user.tenantId);
    }

    @Get()
    @RequirePermissions({ entityType: 'Lead', action: 'Read' })
    @ApiOperation({ summary: 'Get all leads for the current tenant' })
    @ApiResponse({ status: 200, description: 'List of leads retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    findAll(@Req() req) {
        return this.leadsService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Read' })
    @ApiOperation({ summary: 'Get a specific lead by ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Lead ID' })
    @ApiResponse({ status: 200, description: 'Lead retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.leadsService.findOne(id, req.user.tenantId);
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'Lead', action: 'Delete' })
    @ApiOperation({ summary: 'Delete a lead by ID' })
    @ApiParam({ name: 'id', type: 'number', description: 'Lead ID' })
    @ApiResponse({ status: 200, description: 'Lead deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    @ApiResponse({ status: 404, description: 'Not found - Lead does not exist' })
    @ApiResponse({ status: 501, description: 'Not implemented - Delete functionality not yet available' })
    remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        // Note: This assumes you'll add a remove method to LeadsService
        // return this.leadsService.remove(id, req.user.tenantId);
        throw new Error('Delete functionality not yet implemented in service');
    }
}
