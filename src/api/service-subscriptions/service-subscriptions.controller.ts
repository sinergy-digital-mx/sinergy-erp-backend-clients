import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { SERVICE_SUBSCRIPTION_ENTITY } from './service-subscription.constants';
import { ServiceSubscriptionsService } from './service-subscriptions.service';
import { CreateServiceSubscriptionDto } from './dto/create-service-subscription.dto';
import { UpdateServiceSubscriptionDto } from './dto/update-service-subscription.dto';
import { QueryServiceSubscriptionDto } from './dto/query-service-subscription.dto';
import { LinkServiceSubscriptionPeriodDto } from './dto/link-service-subscription-period.dto';
import { RenewServiceSubscriptionDto } from './dto/renew-service-subscription.dto';
import { SendPaymentReminderDto } from './dto/send-payment-reminder.dto';

@ApiTags('Service subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant/service-subscriptions')
export class ServiceSubscriptionsController {
  constructor(private readonly service: ServiceSubscriptionsService) {}

  @Get()
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' })
  @ApiOperation({ summary: 'Listar suscripciones de servicio' })
  list(@Query() query: QueryServiceSubscriptionDto, @Req() req: any) {
    return this.service.list(req.user.tenant_id, query);
  }

  @Post()
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Create' })
  @ApiOperation({ summary: 'Crear suscripción de servicio' })
  create(@Body() dto: CreateServiceSubscriptionDto, @Req() req: any) {
    return this.service.create(req.user.tenant_id, req.user.id, dto);
  }

  @Get('by-sales-order/:salesOrderId')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' })
  @ApiOperation({ summary: 'Suscripción ligada a una orden de venta' })
  bySalesOrder(@Param('salesOrderId') salesOrderId: string, @Req() req: any) {
    return this.service.findBySalesOrder(req.user.tenant_id, salesOrderId);
  }

  @Get(':id/summary-pdf')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' })
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Descargar el resumen del servicio en PDF' })
  async summaryPdf(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.service.buildSummaryPdf(req.user.tenant_id, id);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.send(file.buffer);
  }

  @Post(':id/summary-email')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' })
  @ApiOperation({ summary: 'Enviar por correo el resumen del servicio y el detalle de cada mes' })
  summaryEmail(
    @Param('id') id: string,
    @Body() body: { to_email?: string },
    @Req() req: any,
  ) {
    return this.service.sendSummaryEmail(req.user.tenant_id, id, body?.to_email);
  }

  @Post(':id/periods/:periodId/whatsapp-reminder')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({
    summary:
      'Enviar por WhatsApp el recordatorio de pago del mes (foto con el detalle y la factura en PDF)',
  })
  whatsappReminder(
    @Param('id') id: string,
    @Param('periodId') periodId: string,
    @Body() dto: SendPaymentReminderDto,
    @Req() req: any,
  ) {
    return this.service.sendPaymentReminder(req.user.tenant_id, req.user.id, id, periodId, dto);
  }

  @Get(':id')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Read' })
  @ApiOperation({ summary: 'Detalle de la suscripción y sus meses' })
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.service.getOne(req.user.tenant_id, id);
  }

  @Patch(':id')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Actualizar datos de la suscripción' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceSubscriptionDto, @Req() req: any) {
    return this.service.update(req.user.tenant_id, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Cancelar la suscripción' })
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.service.cancel(req.user.tenant_id, id);
  }

  @Post(':id/renew')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Create' })
  @ApiOperation({ summary: 'Renovar la suscripción por otro plazo' })
  renew(@Param('id') id: string, @Body() dto: RenewServiceSubscriptionDto, @Req() req: any) {
    return this.service.renew(req.user.tenant_id, req.user.id, id, dto);
  }

  @Post(':id/periods/:periodId/generate')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Generar la orden de venta del mes y facturar si es el mes actual' })
  generate(@Param('id') id: string, @Param('periodId') periodId: string, @Req() req: any) {
    return this.service.generate(req.user.tenant_id, req.user.id, id, periodId);
  }

  @Post(':id/periods/:periodId/invoice')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Timbrar la factura de la orden ya ligada a ese mes' })
  invoice(@Param('id') id: string, @Param('periodId') periodId: string, @Req() req: any) {
    return this.service.invoice(req.user.tenant_id, req.user.id, id, periodId);
  }

  @Post(':id/periods/:periodId/link')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Vincular una orden existente a ese mes' })
  link(
    @Param('id') id: string,
    @Param('periodId') periodId: string,
    @Body() dto: LinkServiceSubscriptionPeriodDto,
    @Req() req: any,
  ) {
    return this.service.link(req.user.tenant_id, id, periodId, dto);
  }

  @Post(':id/periods/:periodId/skip')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Omitir el mes' })
  skip(@Param('id') id: string, @Param('periodId') periodId: string, @Req() req: any) {
    return this.service.skip(req.user.tenant_id, id, periodId);
  }

  @Post(':id/periods/:periodId/unlink')
  @RequirePermissions({ entityType: SERVICE_SUBSCRIPTION_ENTITY, action: 'Update' })
  @ApiOperation({ summary: 'Quitar la orden de ese mes' })
  unlink(@Param('id') id: string, @Param('periodId') periodId: string, @Req() req: any) {
    return this.service.unlink(req.user.tenant_id, id, periodId);
  }
}
