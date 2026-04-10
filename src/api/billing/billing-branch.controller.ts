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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { TenantContextService } from '../rbac/services/tenant-context.service';
import { BillingBranchService } from './billing-branch.service';
import { CreateBillingBranchDto } from './dto/create-billing-branch.dto';
import { UpdateBillingBranchDto } from './dto/update-billing-branch.dto';

@ApiTags('Billing - Branches')
@Controller('tenant/fiscal-configurations/:fiscalConfigId/branches')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class BillingBranchController {
  constructor(
    private readonly branchService: BillingBranchService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Create' })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new billing branch' })
  @ApiParam({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  async create(
    @Param('fiscalConfigId') fiscalConfigId: string,
    @Body() dto: CreateBillingBranchDto,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context is required');

    return await this.branchService.create(fiscalConfigId, tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
  @ApiOperation({ summary: 'Get all branches for a fiscal configuration' })
  @ApiParam({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' })
  @ApiResponse({ status: 200, description: 'List of branches' })
  async findAll(@Param('fiscalConfigId') fiscalConfigId: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context is required');

    return await this.branchService.findAll(fiscalConfigId, tenantId);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
  @ApiOperation({ summary: 'Get a specific branch' })
  @ApiParam({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch details' })
  async findOne(
    @Param('fiscalConfigId') fiscalConfigId: string,
    @Param('id') id: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context is required');

    return await this.branchService.findOne(id, fiscalConfigId, tenantId);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Update' })
  @ApiOperation({ summary: 'Update a branch' })
  @ApiParam({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 200, description: 'Branch updated successfully' })
  async update(
    @Param('fiscalConfigId') fiscalConfigId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBillingBranchDto,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context is required');

    return await this.branchService.update(id, fiscalConfigId, tenantId, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiParam({ name: 'fiscalConfigId', description: 'Fiscal Configuration ID' })
  @ApiParam({ name: 'id', description: 'Branch ID' })
  @ApiResponse({ status: 204, description: 'Branch deleted successfully' })
  async remove(
    @Param('fiscalConfigId') fiscalConfigId: string,
    @Param('id') id: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context is required');

    await this.branchService.remove(id, fiscalConfigId, tenantId);
  }
}

@ApiTags('Billing - Branches')
@Controller('tenant/billing/branches')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class BillingBranchAllController {
  constructor(
    private readonly branchService: BillingBranchService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @RequirePermissions({ entityType: 'FiscalConfiguration', action: 'Read' })
  @ApiOperation({ summary: 'Get all branches for the current tenant' })
  @ApiResponse({ status: 200, description: 'List of all branches' })
  async findAll() {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context is required');

    return await this.branchService.findAllByTenant(tenantId);
  }
}
