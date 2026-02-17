import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertyGroupsService } from './property-groups.service';
import { CreatePropertyGroupDto } from './dto/create-property-group.dto';
import { UpdatePropertyGroupDto } from './dto/update-property-group.dto';

@Controller('tenant/property-groups')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PropertyGroupsController {
  constructor(
    private groupsService: PropertyGroupsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Property', action: 'Create' })
  async create(@Req() req: any, @Body() dto: CreatePropertyGroupDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.groupsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async findAll(@Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.groupsService.findAll(tenantId);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async getStats(@Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.groupsService.getGroupStats(tenantId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.groupsService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyGroupDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.groupsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Delete' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.groupsService.remove(tenantId, id);
    return { success: true };
  }
}
