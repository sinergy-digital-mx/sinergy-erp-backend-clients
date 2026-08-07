import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { ShippingsService } from './shippings.service';
import {
  AddShippingStopsDto,
  CreateShippingDto,
  PreviewShippingDto,
  QueryShippingDto,
  ResolveOrdersDto,
  UpdateShippingStatusDto,
} from './dto/shipping.dto';

@ApiTags('Shippings')
@Controller('tenant/shippings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ShippingsController {
  constructor(private readonly service: ShippingsService) {}

  @Post('preview')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({ summary: 'Preview de ruta (km + GPS faltante, sin guardar)' })
  preview(@Body() dto: PreviewShippingDto, @Req() req: any) {
    return this.service.preview(dto, req.user.tenant_id);
  }

  @Post('resolve-orders')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({ summary: 'Resolver GPS de órdenes de venta' })
  resolveOrders(@Body() dto: ResolveOrdersDto, @Req() req: any) {
    return this.service.resolveOrders(dto, req.user.tenant_id);
  }

  @Post()
  @RequirePermissions({ entityType: 'Shipping', action: 'Create' })
  @ApiOperation({ summary: 'Crear envío con paradas' })
  create(@Body() dto: CreateShippingDto, @Req() req: any) {
    return this.service.create(dto, req.user.tenant_id, req.user.id);
  }

  @Get()
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({ summary: 'Listar envíos' })
  findAll(@Query() query: QueryShippingDto, @Req() req: any) {
    return this.service.findAll(req.user.tenant_id, query);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de envío' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.tenant_id);
  }

  @Post(':id/stops')
  @RequirePermissions({ entityType: 'Shipping', action: 'Create' })
  @ApiOperation({ summary: 'Agregar paradas (solo estado Creado)' })
  addStops(
    @Param('id') id: string,
    @Body() dto: AddShippingStopsDto,
    @Req() req: any,
  ) {
    return this.service.addStops(id, dto, req.user.tenant_id);
  }

  @Post(':id/recalculate-distance')
  @RequirePermissions({ entityType: 'Shipping', action: 'Update' })
  @ApiOperation({ summary: 'Recalcular distancia tras cargar GPS' })
  recalculate(@Param('id') id: string, @Req() req: any) {
    return this.service.recalculateDistance(id, req.user.tenant_id);
  }

  @Patch(':id/status')
  @RequirePermissions({ entityType: 'Shipping', action: 'Update' })
  @ApiOperation({ summary: 'Cambiar estado del envío' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateShippingStatusDto,
    @Req() req: any,
  ) {
    return this.service.updateStatus(
      id,
      dto,
      req.user.tenant_id,
      req.user.id,
    );
  }
}
