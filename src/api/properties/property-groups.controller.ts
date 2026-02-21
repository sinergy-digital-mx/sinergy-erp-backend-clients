import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertyGroupsService } from './property-groups.service';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';

@ApiTags('Tenant - Property Groups')
@Controller('tenant/property-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PropertyGroupsController {
  constructor(
    private propertyGroupsService: PropertyGroupsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Property', action: 'Create' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new property group/lot',
    description: 'Creates a new property group (lote) for the current tenant',
  })
  @ApiResponse({
    status: 201,
    description: 'Property group created successfully',
  })
  async create(@Body() dto: CreatePropertyGroupDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertyGroupsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  @ApiOperation({
    summary: 'Get all property groups',
    description: 'Returns all property groups for the current tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'List of property groups',
  })
  async findAll() {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertyGroupsService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  @ApiOperation({
    summary: 'Get property group details',
    description: 'Returns a specific property group with its properties',
  })
  @ApiResponse({
    status: 200,
    description: 'Property group details',
  })
  async findOne(@Param('id') id: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertyGroupsService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Update' })
  @ApiOperation({
    summary: 'Update property group',
    description: 'Updates a property group information',
  })
  @ApiResponse({
    status: 200,
    description: 'Property group updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyGroupDto,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertyGroupsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete property group',
    description: 'Deletes a property group and all its properties',
  })
  @ApiResponse({
    status: 204,
    description: 'Property group deleted successfully',
  })
  async remove(@Param('id') id: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.propertyGroupsService.remove(tenantId, id);
  }

  @Get(':id/stats')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  @ApiOperation({
    summary: 'Get property group statistics',
    description: 'Returns statistics for a property group',
  })
  @ApiResponse({
    status: 200,
    description: 'Property group statistics',
  })
  async getStats(@Param('id') id: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertyGroupsService.getStats(tenantId, id);
  }
}
