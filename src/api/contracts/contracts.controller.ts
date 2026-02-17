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
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('tenant/contracts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ContractsController {
  constructor(
    private contractsService: ContractsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Contract', action: 'Create' })
  async create(@Req() req: any, @Body() dto: CreateContractDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.contractsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async findAll(
    @Req() req: any,
    @Query('customerId') customerId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.contractsService.findAll(
      tenantId,
      customerId ? parseInt(customerId) : undefined,
      propertyId,
      status,
    );
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async getStats(@Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.contractsService.getContractStats(tenantId);
  }

  @Get('by-number/:contractNumber')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async findByNumber(@Param('contractNumber') contractNumber: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.contractsService.findByContractNumber(tenantId, contractNumber);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Contract', action: 'Read' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.contractsService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Contract', action: 'Update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.contractsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Contract', action: 'Delete' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.contractsService.remove(tenantId, id);
    return { success: true };
  }
}
