import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ServiceSubscription } from '../../entities/service-subscriptions/service-subscription.entity';
import { ServiceSubscriptionPeriod } from '../../entities/service-subscriptions/service-subscription-period.entity';
import { ServiceSubscriptionPeriodStatus } from '../../entities/service-subscriptions/service-subscription-period-status.enum';
import { ServiceSubscriptionStatus } from '../../entities/service-subscriptions/service-subscription-status.enum';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Product } from '../../entities/products/product.entity';
import { ProductItemKind } from '../../entities/products/product-item-kind.enum';
import { SalesOrderService } from '../sales-orders/services/sales-order.service';
import { ElectronicInvoiceService } from '../electronic-invoicing/services/electronic-invoice.service';
import {
  buildSelfInvoiceCfdiXml,
  formatCfdiFecha,
} from '../self-invoice/utils/self-invoice-cfdi-xml.util';
import { isFiscalFlagOn } from '../billing/utils/fiscal-tax-policy.util';
import { VEXIA_TENANT_ID } from './service-subscription.constants';
import {
  billingDate,
  formatPeriodLabel,
  isCurrentMonth,
  todayInTimeZone,
} from './utils/service-subscription-months.util';

@Injectable()
export class ServiceSubscriptionBillingService {
  private readonly logger = new Logger(ServiceSubscriptionBillingService.name);

  constructor(
    @InjectRepository(ServiceSubscriptionPeriod)
    private readonly periodRepo: Repository<ServiceSubscriptionPeriod>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
    private readonly salesOrderService: SalesOrderService,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  async billDuePeriods(): Promise<void> {
    const today = todayInTimeZone();
    const periodMonth = `${today.isoDate.slice(0, 7)}-01`;
    const due = await this.periodRepo
      .createQueryBuilder('period')
      .innerJoinAndSelect('period.subscription', 'subscription')
      .where('period.tenant_id = :tenantId', { tenantId: VEXIA_TENANT_ID })
      .andWhere('period.period_month = :periodMonth', { periodMonth })
      .andWhere('period.status = :status', { status: ServiceSubscriptionPeriodStatus.Pending })
      .andWhere('subscription.status = :active', { active: ServiceSubscriptionStatus.Active })
      .andWhere('subscription.billing_day <= :day', { day: today.day })
      .getMany();

    for (const period of due) {
      try {
        await this.generatePeriod(period.subscription, period, period.subscription.created_by);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `No se generó la suscripción ${period.subscription_id} ${periodMonth}: ${message}`,
        );
      }
    }
  }

  async generatePeriod(
    subscription: ServiceSubscription,
    period: ServiceSubscriptionPeriod,
    userId: string,
  ): Promise<ServiceSubscriptionPeriod> {
    if (period.status !== ServiceSubscriptionPeriodStatus.Pending || period.sales_order_id) {
      throw new BadRequestException('Este mes ya tiene orden o no está pendiente');
    }
    if (subscription.status !== ServiceSubscriptionStatus.Active) {
      throw new BadRequestException('La suscripción no está activa');
    }

    const product = await this.productRepo.findOne({
      where: { id: subscription.product_id, tenant_id: subscription.tenant_id },
    });
    if (!product || product.item_kind !== ProductItemKind.Service) {
      throw new BadRequestException('El producto de la suscripción debe ser un servicio');
    }

    const month = String(period.period_month).slice(0, 10);
    const date = billingDate(month, subscription.billing_day);
    const label = formatPeriodLabel(month);

    const order = await this.salesOrderService.create(
      {
        fiscal_configuration_id: subscription.fiscal_configuration_id,
        billing_branch_id: subscription.billing_branch_id,
        customer_id: subscription.customer_id,
        expected_delivery_date: date,
        sales_order_type: 'MANUAL',
        sale_scope: 'services',
        payment_status: 'Pendiente',
        notes: `Suscripción de servicio ${subscription.title} — ${label}`,
        line_items: [
          {
            product_id: subscription.product_id,
            product_uom_id: subscription.product_uom_id,
            quantity: 1,
            unit_price: Number(period.amount),
            iva_percentage: Number(subscription.iva_percentage),
            ieps_percentage: 0,
            discount_percentage: 0,
          },
        ],
      },
      subscription.tenant_id,
      userId,
    );

    await this.alignOrderDate(order.id, subscription.tenant_id, date);

    period.sales_order_id = order.id;
    period.linked_manually = false;
    period.generated_at = new Date();
    period.status = ServiceSubscriptionPeriodStatus.Linked;
    period.invoice_error = null;
    await this.periodRepo.save(period);

    if (isCurrentMonth(month)) {
      return this.stampPeriod(subscription, period, userId);
    }
    return this.periodRepo.save(period);
  }

  async stampPeriod(
    subscription: ServiceSubscription,
    period: ServiceSubscriptionPeriod,
    userId: string,
  ): Promise<ServiceSubscriptionPeriod> {
    if (!period.sales_order_id) {
      throw new BadRequestException('Este mes todavía no tiene orden de venta');
    }

    const existing = await this.findVigenteInvoice(subscription.tenant_id, period.sales_order_id);
    if (existing) {
      period.electronic_invoice_id = existing.id;
      period.status = ServiceSubscriptionPeriodStatus.Invoiced;
      period.invoice_error = null;
      return this.periodRepo.save(period);
    }

    try {
      const invoice = await this.stampOrder(subscription, period.sales_order_id, userId);
      period.electronic_invoice_id = invoice.id;
      period.status = ServiceSubscriptionPeriodStatus.Invoiced;
      period.invoice_error = null;
    } catch (error) {
      period.status = ServiceSubscriptionPeriodStatus.Linked;
      period.invoice_error =
        error instanceof Error ? error.message : 'No se pudo timbrar la factura';
    }
    return this.periodRepo.save(period);
  }

  async syncPeriodInvoices(subscription: ServiceSubscription): Promise<void> {
    const dirty: ServiceSubscriptionPeriod[] = [];
    for (const period of subscription.periods ?? []) {
      if (!period.sales_order_id || period.status === ServiceSubscriptionPeriodStatus.Skipped) {
        continue;
      }
      const invoice = await this.findVigenteInvoice(subscription.tenant_id, period.sales_order_id);
      if (!invoice) continue;
      if (
        period.status === ServiceSubscriptionPeriodStatus.Invoiced &&
        period.electronic_invoice_id === invoice.id
      ) {
        continue;
      }
      period.electronic_invoice_id = invoice.id;
      period.status = ServiceSubscriptionPeriodStatus.Invoiced;
      period.invoice_error = null;
      dirty.push(period);
    }
    if (dirty.length) {
      await this.periodRepo.save(dirty);
    }
  }

  async findVigenteInvoice(tenantId: string, salesOrderId: string) {
    const invoices = await this.electronicInvoiceService.findVigenteBySource(
      tenantId,
      'sales_orders',
      salesOrderId,
    );
    return invoices[0] ?? null;
  }

  async alignOrderDate(orderId: string, tenantId: string, date: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE inv_s_sales_orders
       SET created_at = ?, expected_delivery_date = ?
       WHERE id = ? AND tenant_id = ?`,
      [`${date} 12:00:00`, date, orderId, tenantId],
    );
  }

  private async stampOrder(
    subscription: ServiceSubscription,
    salesOrderId: string,
    userId: string,
  ) {
    const order = await this.salesOrderRepo.findOne({
      where: { id: salesOrderId, tenant_id: subscription.tenant_id },
      relations: [
        'line_items',
        'line_items.product',
        'line_items.product_uom',
        'line_items.product_uom.uom',
        'fiscal_configuration',
        'billing_branch',
        'customer',
      ],
    });
    if (!order) {
      throw new BadRequestException('No se encontró la orden de venta');
    }
    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('No se puede facturar una orden cancelada');
    }

    const customer = order.customer;
    const fiscal = order.fiscal_configuration;
    const rfc = customer?.fiscal_rfc?.trim().toUpperCase();
    const razon = customer?.fiscal_razon_social?.trim() || customer?.name?.trim();
    const postal = String(customer?.fiscal_postal_code ?? '').replace(/\D/g, '');
    const expedicion = String(order.billing_branch?.postal_code ?? '').replace(/\D/g, '');

    if (!rfc || !razon) {
      throw new BadRequestException('El cliente necesita RFC y razón social para facturar');
    }
    if (!/^\d{5}$/.test(postal)) {
      throw new BadRequestException('El cliente necesita código postal fiscal de 5 dígitos');
    }
    if (!/^\d{5}$/.test(expedicion)) {
      throw new BadRequestException('La sucursal necesita código postal de 5 dígitos');
    }
    if (!fiscal?.rfc || !fiscal.razon_social || !fiscal.fiscal_regime) {
      throw new BadRequestException('La razón social no tiene datos fiscales completos');
    }

    const xml = buildSelfInvoiceCfdiXml({
      serie: fiscal.prefix ?? undefined,
      folio: order.folio,
      fecha: formatCfdiFecha(new Date()),
      formaPago: subscription.forma_pago,
      metodoPago: subscription.metodo_pago,
      lugarExpedicion: expedicion,
      emisor: {
        rfc: fiscal.rfc,
        nombre: fiscal.razon_social,
        regimenFiscal: fiscal.fiscal_regime,
      },
      receptor: {
        rfc,
        nombre: razon,
        domicilioFiscal: postal,
        regimenFiscal: subscription.regimen_fiscal_receptor,
        usoCfdi: subscription.uso_cfdi.toUpperCase(),
      },
      lines: (order.line_items ?? []).map((line) => ({
        description: line.custom_description?.trim() || line.product?.name || subscription.title,
        quantity: Number(line.quantity) || 0,
        unitPrice: Number(line.unit_price) || 0,
        discountUnit: Number(line.discount_unit) || 0,
        ivaPercentage: Number(line.iva_percentage) || 0,
        iepsPercentage: isFiscalFlagOn(fiscal?.ieps_enabled, true)
          ? Number(line.ieps_percentage) || 0
          : 0,
        satClave: line.product?.sat_clave,
        uomName: line.product_uom?.uom?.name,
      })),
    });

    return this.electronicInvoiceService.stamp(subscription.tenant_id, userId, {
      fiscal_configuration_id: order.fiscal_configuration_id,
      source_module: 'sales_orders',
      source_id: order.id,
      xml,
      rfc_receptor: rfc,
      receptor_nombre: razon,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      series: fiscal.prefix ?? undefined,
      folio: order.folio,
      tipo_comprobante: 'I',
      metadata: {
        source: 'service_subscription',
        subscription_id: subscription.id,
        customer_id: subscription.customer_id,
      },
    });
  }
}
