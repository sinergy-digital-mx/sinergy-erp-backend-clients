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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('tenant/transactions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private tenantContext: TenantContextService,
  ) {}

  @Post()
  @RequirePermissions({ entityType: 'Transaction', action: 'Create' })
  async create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.transactionsService.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ entityType: 'Transaction', action: 'Read' })
  async findAll(
    @Req() req: any,
    @Query('entityTypeId') entityTypeId?: string,
    @Query('entityId') entityId?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const filters: any = {};
    if (entityTypeId) filters.entityTypeId = parseInt(entityTypeId, 10);
    if (entityId) filters.entityId = entityId;
    if (status) filters.status = status;

    return this.transactionsService.findAll(tenantId, filters);
  }

  @Get('stats')
  @RequirePermissions({ entityType: 'Transaction', action: 'Read' })
  async getStats(
    @Req() req: any,
    @Query('entityTypeId') entityTypeId?: string,
    @Query('entityId') entityId?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    const filters: any = {};
    if (entityTypeId) filters.entityTypeId = parseInt(entityTypeId, 10);
    if (entityId) filters.entityId = entityId;

    return this.transactionsService.getStats(tenantId, filters);
  }

  @Get('by-entity')
  @RequirePermissions({ entityType: 'Transaction', action: 'Read' })
  async getByEntity(
    @Req() req: any,
    @Query('entityTypeId') entityTypeId?: string,
    @Query('entityId') entityId?: string,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }

    if (!entityTypeId || !entityId) {
      throw new Error('entityTypeId and entityId are required');
    }

    return this.transactionsService.getTransactionsByEntity(
      tenantId,
      parseInt(entityTypeId, 10),
      entityId,
    );
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Transaction', action: 'Read' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.transactionsService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions({ entityType: 'Transaction', action: 'Update' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @Req() req: any,
  ) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    return this.transactionsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ entityType: 'Transaction', action: 'Delete' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is required');
    }
    await this.transactionsService.remove(tenantId, id);
    return { success: true };
  }
}
