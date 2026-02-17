import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Controller('tenant/properties')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PropertiesController {
  constructor(
    private propertiesService: PropertiesService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Property', action: 'Create' })
  async create(@Req() req: any, @Body() dto: CreatePropertyDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async findAll(@Req() req: any, @Query('groupId') groupId?: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.findAll(tenantId, groupId);
  }

  @Get('by-code/:code')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async findByCode(@Param('code') code: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.findByCode(tenantId, code);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Property', action: 'Delete' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.propertiesService.remove(tenantId, id);
    return { success: true };
  }
}
