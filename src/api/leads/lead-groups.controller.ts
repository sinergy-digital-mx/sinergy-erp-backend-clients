import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { LeadGroupsService } from './lead-groups.service';
import { CreateLeadGroupDto } from './dto/create-lead-group.dto';
import { UpdateLeadGroupDto } from './dto/update-lead-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('lead-groups')
@ApiTags('Lead Groups')
@ApiBearerAuth()
export class LeadGroupsController {
    constructor(private readonly groupsService: LeadGroupsService) { }

    @Post()
    @RequirePermissions({ entityType: 'leads', action: 'Create' })
    @ApiOperation({ summary: 'Create a new lead group' })
    @ApiBody({ type: CreateLeadGroupDto })
    @ApiResponse({ status: 201, description: 'Lead group created successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    create(@Body() dto: CreateLeadGroupDto, @Req() req: any) {
        return this.groupsService.create(dto, req.user.tenantId);
    }

    @Get()
    @RequirePermissions({ entityType: 'leads', action: 'Read' })
    @ApiOperation({ summary: 'Get all lead groups for tenant' })
    @ApiResponse({ status: 200, description: 'Lead groups retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    findAll(@Req() req: any) {
        return this.groupsService.findAll(req.user.tenantId);
    }

    @Get(':id')
    @RequirePermissions({ entityType: 'leads', action: 'Read' })
    @ApiOperation({ summary: 'Get a specific lead group with its leads' })
    @ApiParam({ name: 'id', type: 'string', description: 'Lead group ID' })
    @ApiResponse({ status: 200, description: 'Lead group retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Lead group not found' })
    findOne(@Param('id') id: string, @Req() req: any) {
        return this.groupsService.findOne(id, req.user.tenantId);
    }

    @Put(':id')
    @RequirePermissions({ entityType: 'leads', action: 'Update' })
    @ApiOperation({ summary: 'Update a lead group' })
    @ApiParam({ name: 'id', type: 'string', description: 'Lead group ID' })
    @ApiBody({ type: UpdateLeadGroupDto })
    @ApiResponse({ status: 200, description: 'Lead group updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Lead group not found' })
    update(@Param('id') id: string, @Body() dto: UpdateLeadGroupDto, @Req() req: any) {
        return this.groupsService.update(id, dto, req.user.tenantId);
    }

    @Delete(':id')
    @RequirePermissions({ entityType: 'leads', action: 'Delete' })
    @ApiOperation({ summary: 'Delete a lead group' })
    @ApiParam({ name: 'id', type: 'string', description: 'Lead group ID' })
    @ApiResponse({ status: 200, description: 'Lead group deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Lead group not found' })
    remove(@Param('id') id: string, @Req() req: any) {
        return this.groupsService.remove(id, req.user.tenantId);
    }
}
