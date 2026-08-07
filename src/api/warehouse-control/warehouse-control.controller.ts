import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantModuleValidationGuard } from '../auth/tenant-module-validation.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { WarehouseControlService } from './warehouse-control.service';
import { QueryWarehouseControlDto } from './dto/query-warehouse-control.dto';
import { CorroborateSalesOrderDto } from './dto/corroborate-sales-order.dto';

@ApiTags('Warehouse Control')
@Controller('tenant/warehouse-control')
@UseGuards(JwtAuthGuard, TenantModuleValidationGuard, PermissionGuard)
@ApiBearerAuth()
export class WarehouseControlController {
  constructor(private readonly service: WarehouseControlService) {}

  @Get()
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Read' })
  @ApiOperation({
    summary: 'Listar órdenes en selección pendientes de corroboración',
  })
  findPending(@Query() query: QueryWarehouseControlDto, @Req() req: any) {
    return this.service.findPending(req.user.tenant_id, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Read' })
  @ApiOperation({
    summary: 'Detalle de corroboración (productos, UOM, almacén, stock)',
  })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOneForCorroboration(id, req.user.tenant_id);
  }

  @Post(':id/corroborate')
  @RequirePermissions({ entityType: 'WarehouseControl', action: 'Update' })
  @ApiOperation({
    summary: 'Confirmar corroboración / picking → Lista para entrega',
  })
  corroborate(
    @Param('id') id: string,
    @Body() dto: CorroborateSalesOrderDto,
    @Req() req: any,
  ) {
    return this.service.corroborate(
      id,
      dto,
      req.user.tenant_id,
      req.user.id,
    );
  }
}
