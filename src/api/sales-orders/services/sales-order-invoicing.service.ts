import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { CancelElectronicInvoiceDto } from '../../electronic-invoicing/dto/cancel-electronic-invoice.dto';
import { StampSalesOrderInvoiceDto } from '../dto/stamp-sales-order-invoice.dto';

/**
 * Lógica de negocio de facturación para órdenes de venta.
 * Construye el contexto desde la OV y delega timbrado/cancel/sync al módulo electronic-invoicing.
 */
@Injectable()
export class SalesOrderInvoicingService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  async listInvoices(salesOrderId: string, tenantId: string) {
    await this.getSalesOrderOrFail(salesOrderId, tenantId);
    return this.electronicInvoiceService.findBySource(
      tenantId,
      'sales_orders',
      salesOrderId,
    );
  }

  async stampInvoice(
    salesOrderId: string,
    tenantId: string,
    userId: string,
    dto: StampSalesOrderInvoiceDto,
  ) {
    const order = await this.getSalesOrderWithRelations(salesOrderId, tenantId);

    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede facturar una orden cancelada');
    }

    const customer = await this.customerRepo.findOne({
      where: { id: order.customer_id },
    });

    if (!customer?.fiscal_rfc) {
      throw new BadRequestException('El cliente debe tener RFC configurado');
    }

    // El XML CFDI 4.0 lo construye el módulo de OV (o el frontend lo envía pre-armado).
    // Por ahora se recibe en dto.xml; la generación automática se implementará en iteración siguiente.
    const xml = dto.xml ?? this.buildXmlPlaceholder(order, customer);

    return this.electronicInvoiceService.stamp(tenantId, userId, {
      fiscal_configuration_id: order.fiscal_configuration_id,
      source_module: 'sales_orders',
      source_id: salesOrderId,
      xml,
      rfc_receptor: customer.fiscal_rfc,
      receptor_nombre: customer.fiscal_razon_social ?? customer.name ?? undefined,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      series: dto.series,
      folio: dto.folio ?? order.folio,
      tipo_comprobante: dto.tipo_comprobante ?? 'I',
      certificate_serial: dto.certificate_serial,
      environment: dto.environment,
      metadata: {
        sales_order_folio: order.folio,
        customer_id: order.customer_id,
      },
    });
  }

  async cancelInvoice(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    userId: string,
    dto: CancelElectronicInvoiceDto,
  ) {
    await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    return this.electronicInvoiceService.cancel(invoiceId, tenantId, userId, dto);
  }

  async syncInvoiceSat(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    userId: string,
  ) {
    await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    return this.electronicInvoiceService.syncSatStatus(
      invoiceId,
      tenantId,
      userId,
      'manual',
    );
  }

  async getInvoicePdf(
    salesOrderId: string,
    invoiceId: string,
    tenantId: string,
    regenerate = false,
    preview = false,
  ) {
    await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    return this.electronicInvoiceService.getPdfDownload(invoiceId, tenantId, regenerate, preview);
  }

  async getInvoiceXml(salesOrderId: string, invoiceId: string, tenantId: string) {
    await this.getSalesOrderOrFail(salesOrderId, tenantId);
    const invoice = await this.electronicInvoiceService.findOne(invoiceId, tenantId);

    if (invoice.source_module !== 'sales_orders' || invoice.source_id !== salesOrderId) {
      throw new NotFoundException('La factura no pertenece a esta orden de venta');
    }

    return this.electronicInvoiceService.getXmlDownload(invoiceId, tenantId);
  }

  private buildXmlPlaceholder(order: SalesOrder, customer: Customer): string {
    throw new BadRequestException(
      'Debe enviar el XML CFDI en el campo xml. La generación automática desde la orden estará disponible próximamente.',
    );
  }

  private async getSalesOrderOrFail(id: string, tenantId: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }
    return order;
  }

  private async getSalesOrderWithRelations(
    id: string,
    tenantId: string,
  ): Promise<SalesOrder> {
    const order = await this.salesOrderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['line_items', 'fiscal_configuration'],
    });
    if (!order) {
      throw new NotFoundException('Orden de venta no encontrada');
    }
    return order;
  }
}
