import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { ShippingsService } from './shippings.service';
import { CartaPorteService } from './services/carta-porte.service';
import { CartaPortePdfService } from './services/carta-porte-pdf.service';
import {
  AddShippingStopsDto,
  AddShippingTransfersDto,
  CreateShippingDto,
  PreviewShippingDto,
  QueryAvailableShippingOrdersDto,
  QueryShippingDto,
  ResolveOrdersDto,
  SetShippingStopAddressDto,
  StampCartaPorteDto,
  UpdateShippingCrewDto,
  UpdateShippingStatusDto,
} from './dto/shipping.dto';

@ApiTags('Shippings')
@Controller('tenant/shippings')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ShippingsController {
  constructor(
    private readonly service: ShippingsService,
    private readonly cartaPorte: CartaPorteService,
    private readonly cartaPortePdf: CartaPortePdfService,
  ) {}

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

  @Get('available-orders')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({
    summary:
      'Órdenes Surtida / Lista para entrega de la sucursal (elegibles para envío)',
  })
  findAvailableOrders(
    @Query() query: QueryAvailableShippingOrdersDto,
    @Req() req: any,
  ) {
    return this.service.findAvailableOrders(req.user.tenant_id, query);
  }

  @Get('drivers')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({
    summary: 'Choferes activos para crear o editar un envío',
    description:
      'No pide permiso de usuarios. Devuelve solo usuarios marcados como chofer y que no están inactivos ni eliminados.',
  })
  listDrivers(@Req() req: any) {
    return this.service.listDrivers(req.user.tenant_id);
  }

  @Get(':id')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({ summary: 'Detalle de envío' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user.tenant_id);
  }

  @Post(':id/carta-porte')
  @RequirePermissions({ entityType: 'Shipping', action: 'Update' })
  @ApiOperation({
    summary: 'Timbrar carta porte del viaje',
    description:
      'CFDI de traslado con complemento Carta Porte 3.1. environment demo timbra en Finkok Demo para ver el PDF. Una carta porte de producción no se vuelve a timbrar.',
  })
  stampCartaPorte(
    @Param('id') id: string,
    @Body() dto: StampCartaPorteDto,
    @Req() req: any,
  ) {
    return this.cartaPorte.stamp(
      id,
      req.user.tenant_id,
      dto.peso_bruto_kg,
      dto.environment,
    );
  }

  @Get(':id/carta-porte/pdf')
  @RequirePermissions({ entityType: 'Shipping', action: 'Read' })
  @ApiOperation({ summary: 'PDF de la carta porte timbrada' })
  async downloadCartaPortePdf(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ): Promise<void> {
    const { buffer, filename } = await this.cartaPortePdf.generate(
      id,
      req.user.tenant_id,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Patch(':id/stops/:salesOrderId/address')
  @RequirePermissions({ entityType: 'Shipping', action: 'Update' })
  @ApiOperation({
    summary: 'Elegir la dirección de entrega de una parada',
    description:
      'Solo en envíos Creado. La parada queda con esa dirección del cliente y se recalcula la ruta.',
  })
  setStopAddress(
    @Param('id') id: string,
    @Param('salesOrderId') salesOrderId: string,
    @Body() dto: SetShippingStopAddressDto,
    @Req() req: any,
  ) {
    return this.service.setStopAddress(
      id,
      salesOrderId,
      dto.customer_address_id,
      req.user.tenant_id,
    );
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

  @Post(':id/transfers')
  @RequirePermissions({ entityType: 'Shipping', action: 'Create' })
  @ApiOperation({
    summary: 'Agregar transferencias de inventario a un envío creado',
    description:
      'El envío puede llevar varias transferencias de la misma sucursal de origen. Pasan a in_transit.',
  })
  addTransfers(
    @Param('id') id: string,
    @Body() dto: AddShippingTransfersDto,
    @Req() req: any,
  ) {
    return this.service.addTransfers(id, dto, req.user.tenant_id);
  }

  @Post(':id/recalculate-distance')
  @RequirePermissions({ entityType: 'Shipping', action: 'Update' })
  @ApiOperation({ summary: 'Recalcular distancia tras cargar GPS' })
  recalculate(@Param('id') id: string, @Req() req: any) {
    return this.service.recalculateDistance(id, req.user.tenant_id);
  }

  @Patch(':id/crew')
  @RequirePermissions({ entityType: 'Shipping', action: 'Update' })
  @ApiOperation({
    summary: 'Cambiar chofer y camión de un viaje creado o en ruta',
  })
  updateCrew(
    @Param('id') id: string,
    @Body() dto: UpdateShippingCrewDto,
    @Req() req: any,
  ) {
    return this.service.updateCrew(id, dto, req.user.tenant_id);
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
