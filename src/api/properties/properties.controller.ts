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
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import {
  RequireAnyPermissions,
  RequirePermissions,
  RequiredPermission,
} from '../rbac/decorators/require-permissions.decorator';
import { PermissionService } from '../rbac/services/permission.service';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { PropertiesService } from './properties.service';
import { PropertyImportService } from './property-import.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';

export const PROPERTY_LIST_PERMISSIONS: RequiredPermission[] = [
  { entityType: 'Property', action: 'Read' },
  { entityType: 'DivinoReservationFormat', action: 'Read' },
  { entityType: 'DivinoReservationFormat', action: 'Create' },
  { entityType: 'DivinoReservationFormat', action: 'Update' },
];

@Controller('tenant/properties')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PropertiesController {
  constructor(
    private propertiesService: PropertiesService,
    private propertyImportService: PropertyImportService,
    private tenantContext: TenantContextService,
    private permissionService: PermissionService,
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

  @Get('measurement-units/all')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async getMeasurementUnits() {
    return this.propertiesService.getMeasurementUnits();
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

  @Get('stats')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async getListStats(@Req() req: any, @Query() query: QueryPropertiesDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.getListStats(tenantId, this.toPropertyFilters(query));
  }

  @Get('blocks')
  @RequirePermissions({ entityType: 'Property', action: 'Read' })
  async listBlocks() {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.propertiesService.listBlocks(tenantId);
  }

  @Get('import/template')
  @RequirePermissions({ entityType: 'Property', action: 'Create' })
  async downloadImportTemplate(@Res() res: any) {
    const organizationId = this.requireOrganizationId();
    const { buffer, filename } =
      await this.propertyImportService.exportTemplate(organizationId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('import')
  @RequirePermissions({ entityType: 'Property', action: 'Create' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importProperties(@UploadedFile() file: Express.Multer.File) {
    const organizationId = this.requireOrganizationId();
    return this.propertyImportService.startImportJob(organizationId, file);
  }

  @Get('import/jobs/:jobId')
  @RequirePermissions({ entityType: 'Property', action: 'Create' })
  getImportJob(@Param('jobId') jobId: string) {
    return this.propertyImportService.getJobStatus(jobId, this.requireOrganizationId());
  }

  @Get()
  @RequireAnyPermissions(...PROPERTY_LIST_PERMISSIONS)
  async findAll(@Req() req: any, @Query() query: QueryPropertiesDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 20;

    const filters = this.toPropertyFilters(query);
    const userId = req.user?.id ?? this.tenantContext.getCurrentUserId();
    const fullAccess = userId
      ? await this.permissionService.hasPermission(userId, tenantId, 'Property', 'Read')
      : false;

    if (!fullAccess) {
      return this.propertiesService.findLotLookup(tenantId, filters, pageNum, limitNum);
    }

    return this.propertiesService.findAll(tenantId, filters, pageNum, limitNum);
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

  private requireOrganizationId(): string {
    const organizationId = this.tenantContext.getCurrentTenantId();
    if (!organizationId) {
      throw new BadRequestException('No se pudo identificar la organización.');
    }
    return organizationId;
  }

  private toPropertyFilters(query: QueryPropertiesDto) {
    return {
      group_id: query.group_id || query.groupId || query.customer_group_id,
      search: query.search,
      status: query.status,
      block: query.block?.trim() || undefined,
    };
  }
}
