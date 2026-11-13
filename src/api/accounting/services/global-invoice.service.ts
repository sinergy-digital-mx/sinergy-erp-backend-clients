import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { In, QueryFailedError, Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { GlobalInvoice } from '../../../entities/accounting/global-invoice.entity';
import { GlobalInvoiceOrder } from '../../../entities/accounting/global-invoice-order.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { PosSaleCollection } from '../../../entities/pos/pos-sale-collection.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { isFiscalFlagOn } from '../../billing/utils/fiscal-tax-policy.util';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import {
  buildSelfInvoiceCfdiXml,
  formatCfdiFecha,
  SelfInvoiceCfdiLine,
} from '../../self-invoice/utils/self-invoice-cfdi-xml.util';
import { buildSalesOrderPaymentDisplay } from '../../sales-orders/utils/sales-order-payment-display.util';
import { formatCustomerDisplayName } from '../../pos-shifts/mappers/pos-sale-collection.mapper';
import { CreateGlobalInvoiceDto } from '../dto/query-global-invoice.dto';
import {
  fiveDigitPostalCode,
  GlobalInvoicePeriod,
  globalInvoiceActiveKey,
  parseGlobalInvoiceMonth,
  readXmlAttr,
  resolveGlobalInvoicePayment,
} from '../utils/global-invoice.util';
import {
  PublicInvoicePolicyView,
  readPublicInvoicePolicy,
  toPublicInvoicePolicyView,
} from '../utils/public-invoice-policy.util';

const PUBLIC_RFC = 'XAXX010101000';
const PUBLIC_NAME = 'PUBLICO EN GENERAL';
const PENDING_GRACE_MS = 120_000;

export interface GlobalInvoiceOrderRow {
  id: string;
  folio: string;
  created_at: string;
  customer_name: string;
  company_name: string | null;
  branch_label: string | null;
  general_status: string;
  payment_status: string;
  currency: string;
  subtotal: number;
  iva_total: number;
  ieps_total: number;
  discount_total: number;
  total: number;
  payment_method: string | null;
  payment_method_label: string | null;
  payment_breakdown_label: string | null;
  payment_lines: Array<{
    method: string;
    label: string;
    amount_mxn: number;
    amount_usd: number;
  }>;
}

export interface GlobalInvoiceCard {
  id: string;
  status: GlobalInvoice['status'];
  electronic_invoice_id: string | null;
  series: string | null;
  folio: string | null;
  uuid: string | null;
  subtotal: number;
  total: number;
  currency: string;
  stamp_status: string | null;
  sat_status: string | null;
  can_cancel: boolean;
  process_folio: string | null;
}

export interface GlobalInvoiceBranchOption {
  id: string;
  label: string;
  fiscal_configuration_id: string;
}

export interface GlobalInvoicePage {
  month: string;
  period_label: string;
  branches: GlobalInvoiceBranchOption[];
  billing_branch_id: string | null;
  fiscal_configuration_id: string | null;
  invoice: GlobalInvoiceCard | null;
  cancelled_invoice: GlobalInvoiceCard | null;
  orders: GlobalInvoiceOrderRow[];
  orders_count: number;
  orders_total: number | null;
  currency: string | null;
  can_generate: boolean;
  blocked_reason: string | null;
  policy: PublicInvoicePolicyView | null;
}

@Injectable()
export class GlobalInvoiceService {
  private readonly logger = new Logger(GlobalInvoiceService.name);

  constructor(
    @InjectRepository(GlobalInvoice)
    private readonly globalRepo: Repository<GlobalInvoice>,
    @InjectRepository(GlobalInvoiceOrder)
    private readonly linkRepo: Repository<GlobalInvoiceOrder>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderPayment)
    private readonly paymentRepo: Repository<SalesOrderPayment>,
    @InjectRepository(PosSaleCollection)
    private readonly collectionRepo: Repository<PosSaleCollection>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(ElectronicInvoice)
    private readonly invoiceRepo: Repository<ElectronicInvoice>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  async get(
    tenantId: string,
    month: string,
    billingBranchId?: string,
  ): Promise<GlobalInvoicePage> {
    const period = this.periodOrFail(month);
    const branches = await this.listBranches(tenantId, billingBranchId);
    const options = this.branchOptions(branches);
    const branch =
      branches.find((item) => item.id === billingBranchId) ??
      (branches.length === 1 ? branches[0] : null);

    if (!branch?.fiscal_configuration || branch.fiscal_configuration.tenant_id !== tenantId) {
      return this.emptyPage(
        period,
        options,
        options.length ? 'Selecciona la sucursal.' : 'No hay sucursales para facturar.',
      );
    }

    const fiscal = branch.fiscal_configuration;
    await this.releaseStalePending(tenantId, branch, period);
    const open =
      (await this.findOpen(tenantId, branch.id, period)) ??
      (await this.findLegacyOpen(tenantId, branch, period));
    const cancelled = await this.globalRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: branch.id,
        period_year: period.year,
        period_month: period.month,
        status: 'cancelled',
      },
      order: { created_at: 'DESC' },
    });

    const orders = open
      ? await this.loadLinkedOrders(tenantId, open.id)
      : await this.loadUninvoicedOrders(tenantId, branch, period);
    const invoice = await this.toCard(tenantId, open);
    const cancelledInvoice =
      open?.status === 'active' ? null : await this.toCard(tenantId, cancelled);
    const currencies = [
      ...new Set(orders.map((order) => order.currency || 'MXN')),
    ];
    const currency = currencies.length === 1 ? currencies[0] : null;

    let blocked: string | null = null;
    if (fiscal.finkok_registration_status !== 'registered' || !fiscal.fiscal_regime) {
      blocked = 'La razón social de esta sucursal aún no puede timbrar.';
    } else if (open?.status === 'pending') {
      blocked = 'Hay una factura a público en general en proceso para esta sucursal.';
    } else if (!open && currencies.length > 1) {
      blocked =
        'Esta sucursal tiene órdenes en pesos y en dólares. La factura a público en general es un solo comprobante y solo puede llevar una moneda.';
    }

    const total = currency
      ? round2(orders.reduce((sum, order) => sum + order.total, 0))
      : null;

    return {
      month: `${period.year}-${String(period.month).padStart(2, '0')}`,
      period_label: period.label,
      branches: options,
      billing_branch_id: branch.id,
      fiscal_configuration_id: fiscal.id,
      invoice,
      cancelled_invoice: cancelledInvoice,
      orders,
      orders_count: orders.length,
      orders_total: total,
      currency,
      can_generate: !open && orders.length > 0 && !blocked,
      blocked_reason: blocked,
      policy: toPublicInvoicePolicyView(fiscal),
    };
  }

  async generate(
    tenantId: string,
    userId: string | null,
    dto: CreateGlobalInvoiceDto,
    options?: { processFolio?: string },
  ): Promise<GlobalInvoicePage> {
    const period = this.periodOrFail(dto.month);
    const branch = await this.branchRepo.findOne({
      where: { id: dto.billing_branch_id },
      relations: { fiscal_configuration: true },
    });
    const fiscal = branch?.fiscal_configuration;
    if (!branch || !fiscal || fiscal.tenant_id !== tenantId) {
      throw new NotFoundException('Sucursal no encontrada');
    }
    if (fiscal.finkok_registration_status !== 'registered' || !fiscal.fiscal_regime) {
      throw new BadRequestException('La razón social de esta sucursal aún no puede timbrar.');
    }

    await this.releaseStalePending(tenantId, branch, period);
    const open =
      (await this.findOpen(tenantId, branch.id, period)) ??
      (await this.findLegacyOpen(tenantId, branch, period));
    if (open?.status === 'active') {
      throw new BadRequestException(
        'Esta sucursal ya tiene una factura a público en general en este mes.',
      );
    }
    if (open?.status === 'pending') {
      throw new BadRequestException(
        'Hay una factura a público en general en proceso para esta sucursal.',
      );
    }

    const orders = await this.loadOrderEntities(tenantId, branch, period, true);
    this.assertSelection(orders, dto.order_ids);
    const currency = this.singleCurrency(orders);
    const exchangeRate = this.exchangeRate(orders, currency);
    const lugarExpedicion = this.lugarExpedicion(branch);
    const mm = String(period.month).padStart(2, '0');
    const folio = await this.nextFolio(tenantId, fiscal.id, period);
    const serie = (fiscal.prefix?.trim() || 'FG').slice(0, 25);
    const lines = this.conceptLines(orders, fiscal);
    const payment = resolveGlobalInvoicePayment(await this.paymentSnapshots(tenantId, orders));

    let xml: string;
    try {
      xml = buildSelfInvoiceCfdiXml({
        serie,
        folio,
        fecha: formatCfdiFecha(new Date()),
        formaPago: payment.formaPago,
        metodoPago: payment.metodoPago,
        lugarExpedicion,
        currency,
        exchangeRate,
        informacionGlobal: {
          periodicidad: '04',
          meses: mm,
          anio: String(period.year),
        },
        emisor: {
          rfc: fiscal.rfc,
          nombre: fiscal.razon_social.trim().toUpperCase(),
          regimenFiscal: fiscal.fiscal_regime,
        },
        receptor: {
          rfc: PUBLIC_RFC,
          nombre: PUBLIC_NAME,
          domicilioFiscal: lugarExpedicion,
          regimenFiscal: '616',
          usoCfdi: 'S01',
        },
        lines,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo armar la factura';
      throw new BadRequestException(message);
    }

    const id = randomUUID();
    try {
      await this.globalRepo.insert({
        id,
        tenant_id: tenantId,
        fiscal_configuration_id: fiscal.id,
        billing_branch_id: branch.id,
        period_year: period.year,
        period_month: period.month,
        status: 'pending',
        active_key: globalInvoiceActiveKey(branch.id, period.year, period.month),
        created_by: userId,
      });
    } catch (error) {
      if (this.isDuplicate(error)) {
        throw new BadRequestException(
          'Esta sucursal ya tiene una factura a público en general en este mes.',
        );
      }
      throw error;
    }

    let stamped = false;
    try {
      await this.linkRepo.insert(
        orders.map((order) => ({
          id: randomUUID(),
          global_invoice_id: id,
          sales_order_id: order.id,
        })),
      );
      await this.electronicInvoiceService.assertNoActiveProductionInvoice(
        tenantId,
        'global_invoices',
        id,
        dto.environment,
      );
      const invoice = await this.electronicInvoiceService.stamp(tenantId, userId, {
        fiscal_configuration_id: fiscal.id,
        source_module: 'global_invoices',
        source_id: id,
        xml,
        rfc_receptor: PUBLIC_RFC,
        receptor_nombre: PUBLIC_NAME,
        rfc_emisor: fiscal.rfc,
        subtotal: Number(readXmlAttr(xml, 'SubTotal')) || 0,
        total: Number(readXmlAttr(xml, 'Total')) || 0,
        series: serie,
        folio,
        tipo_comprobante: 'I',
        currency,
        environment: dto.environment,
        invoice_role: 'standard',
        metadata: {
          global_invoice: true,
          month: `${period.year}-${mm}`,
          billing_branch_id: branch.id,
          order_ids: orders.map((order) => order.id),
        },
      });
      stamped = true;
      await this.globalRepo.update(id, {
        status: 'active',
        electronic_invoice_id: invoice.id,
        ...(options?.processFolio ? { process_folio: options.processFolio } : {}),
      });
      if (options?.processFolio) {
        await this.appendProcessNote(
          tenantId,
          orders.map((order) => order.id),
          options.processFolio,
        );
      }
    } catch (error) {
      if (!stamped) {
        await this.linkRepo.delete({ global_invoice_id: id }).catch(() => undefined);
        await this.globalRepo.delete({ id }).catch(() => undefined);
      }
      throw error;
    }

    return this.get(tenantId, dto.month, branch.id);
  }

  async stampAutomaticBranch(
    tenantId: string,
    billingBranchId: string,
    month: string,
    processFolio: string,
    environment: 'demo' | 'production',
  ): Promise<'stamped' | 'empty' | 'already_open'> {
    const period = this.periodOrFail(month);
    const branch = await this.branchRepo.findOne({
      where: { id: billingBranchId },
      relations: { fiscal_configuration: true },
    });
    const fiscal = branch?.fiscal_configuration;
    if (!branch || !fiscal || fiscal.tenant_id !== tenantId) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    await this.releaseStalePending(tenantId, branch, period);
    const open =
      (await this.findOpen(tenantId, branch.id, period)) ??
      (await this.findLegacyOpen(tenantId, branch, period));
    if (open) return 'already_open';

    const orders = await this.loadOrderEntities(tenantId, branch, period, true);
    if (!orders.length) return 'empty';

    await this.generate(
      tenantId,
      null,
      {
        month,
        billing_branch_id: branch.id,
        order_ids: orders.map((order) => order.id),
        environment,
      },
      { processFolio },
    );
    return 'stamped';
  }

  async cancel(id: string, tenantId: string, userId: string): Promise<GlobalInvoicePage> {
    const row = await this.globalRepo.findOne({ where: { id, tenant_id: tenantId } });
    if (!row) {
      throw new NotFoundException('Factura a público en general no encontrada');
    }
    if (row.status === 'cancelled') {
      throw new BadRequestException('Esta factura a público en general ya está cancelada');
    }
    if (row.status !== 'active' || !row.electronic_invoice_id) {
      throw new BadRequestException(
        'Esta factura a público en general todavía no se puede cancelar',
      );
    }

    const invoice = await this.electronicInvoiceService.cancel(
      row.electronic_invoice_id,
      tenantId,
      userId,
      { motivo: '02' },
    );
    if (invoice.stamp_status === 'cancelled' || invoice.sat_status === 'Cancelado') {
      await this.globalRepo.query(
        `UPDATE global_invoices
         SET status = 'cancelled', active_key = NULL
         WHERE id = ? AND tenant_id = ?`,
        [row.id, tenantId],
      );
    }

    const month = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
    const branchId = row.billing_branch_id ?? (await this.branchIdOfInvoice(row.id));
    return this.get(tenantId, month, branchId);
  }

  private periodOrFail(month: string): GlobalInvoicePeriod {
    const period = parseGlobalInvoiceMonth(month);
    if (!period) {
      throw new BadRequestException('Indica el mes con formato AAAA-MM');
    }
    return period;
  }

  private async findOpen(
    tenantId: string,
    billingBranchId: string,
    period: GlobalInvoicePeriod,
  ): Promise<GlobalInvoice | null> {
    const active = await this.globalRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: billingBranchId,
        period_year: period.year,
        period_month: period.month,
        status: 'active',
      },
    });
    if (active) return active;
    return this.globalRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: billingBranchId,
        period_year: period.year,
        period_month: period.month,
        status: 'pending',
      },
    });
  }

  private findLegacyOpen(
    tenantId: string,
    branch: BillingBranch,
    period: GlobalInvoicePeriod,
  ): Promise<GlobalInvoice | null> {
    return this.globalRepo
      .createQueryBuilder('gi')
      .where('gi.tenant_id = :tenantId', { tenantId })
      .andWhere('gi.fiscal_configuration_id = :fiscalId', {
        fiscalId: branch.fiscal_configuration_id,
      })
      .andWhere('gi.billing_branch_id IS NULL')
      .andWhere('gi.period_year = :year', { year: period.year })
      .andWhere('gi.period_month = :month', { month: period.month })
      .andWhere("gi.status IN ('pending', 'active')")
      .andWhere(
        `EXISTS (
          SELECT 1 FROM global_invoice_orders gio
          INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
          WHERE gio.global_invoice_id = gi.id
            AND so.billing_branch_id = :branchId
        )`,
        { branchId: branch.id },
      )
      .orderBy('gi.created_at', 'DESC')
      .getOne();
  }

  private async releaseStalePending(
    tenantId: string,
    branch: BillingBranch,
    period: GlobalInvoicePeriod,
  ): Promise<void> {
    const pending = await this.globalRepo.findOne({
      where: {
        tenant_id: tenantId,
        billing_branch_id: branch.id,
        period_year: period.year,
        period_month: period.month,
        status: 'pending',
      },
    });
    await this.settlePending(tenantId, pending);

    const legacy = await this.globalRepo
      .createQueryBuilder('gi')
      .where('gi.tenant_id = :tenantId', { tenantId })
      .andWhere('gi.fiscal_configuration_id = :fiscalId', {
        fiscalId: branch.fiscal_configuration_id,
      })
      .andWhere('gi.billing_branch_id IS NULL')
      .andWhere('gi.period_year = :year', { year: period.year })
      .andWhere('gi.period_month = :month', { month: period.month })
      .andWhere('gi.status = :status', { status: 'pending' })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM global_invoice_orders gio
          INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
          WHERE gio.global_invoice_id = gi.id
            AND so.billing_branch_id = :branchId
        )`,
        { branchId: branch.id },
      )
      .getOne();
    if (legacy && legacy.id !== pending?.id) {
      await this.settlePending(tenantId, legacy);
    }
  }

  private async settlePending(tenantId: string, pending: GlobalInvoice | null): Promise<void> {
    if (!pending) return;

    const invoices = await this.electronicInvoiceService.findBySource(
      tenantId,
      'global_invoices',
      pending.id,
    );
    const vigente = invoices.find((invoice) =>
      this.electronicInvoiceService.isCfdiVigente(invoice),
    );
    if (vigente) {
      await this.globalRepo.update(pending.id, {
        status: 'active',
        electronic_invoice_id: vigente.id,
      });
      return;
    }

    const age = Date.now() - new Date(pending.created_at).getTime();
    if (age < PENDING_GRACE_MS) return;
    await this.linkRepo.delete({ global_invoice_id: pending.id });
    await this.globalRepo.delete({ id: pending.id });
  }

  private async loadUninvoicedOrders(
    tenantId: string,
    branch: BillingBranch,
    period: GlobalInvoicePeriod,
  ): Promise<GlobalInvoiceOrderRow[]> {
    const orders = await this.loadOrderEntities(tenantId, branch, period, true);
    return this.toRows(tenantId, orders);
  }

  private async loadLinkedOrders(
    tenantId: string,
    globalInvoiceId: string,
  ): Promise<GlobalInvoiceOrderRow[]> {
    const links = await this.linkRepo.find({ where: { global_invoice_id: globalInvoiceId } });
    if (!links.length) return [];
    const orders = await this.salesOrderRepo.find({
      where: { tenant_id: tenantId, id: In(links.map((link) => link.sales_order_id)) },
      relations: {
        customer: true,
        billing_branch: true,
        line_items: { product: true, product_uom: { uom: true } },
      },
      order: { created_at: 'ASC' },
    });
    return this.toRows(tenantId, orders);
  }

  private loadOrderEntities(
    tenantId: string,
    branch: BillingBranch,
    period: GlobalInvoicePeriod,
    onlyUninvoiced: boolean,
  ): Promise<SalesOrder[]> {
    const qb = this.salesOrderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.billing_branch', 'branch')
      .leftJoinAndSelect('so.line_items', 'line')
      .leftJoinAndSelect('line.product', 'product')
      .leftJoinAndSelect('line.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.billing_branch_id = :branchId', { branchId: branch.id })
      .andWhere('so.fiscal_configuration_id = :fiscalId', {
        fiscalId: branch.fiscal_configuration_id,
      })
      .andWhere('so.general_status != :cancelled', { cancelled: 'Cancelada' })
      .andWhere(`DATE(CONVERT_TZ(so.created_at, '+00:00', :timeZone)) BETWEEN :from AND :to`, {
        timeZone: readPublicInvoicePolicy(branch.fiscal_configuration).timeZone,
        from: period.from,
        to: period.to,
      })
      .orderBy('so.created_at', 'ASC')
      .addOrderBy('so.folio', 'ASC');

    if (onlyUninvoiced) {
      qb.andWhere(`NOT EXISTS (
        SELECT 1 FROM electronic_invoices ei
        WHERE ei.tenant_id = so.tenant_id
          AND ei.source_module = 'sales_orders'
          AND ei.source_id = so.id
          AND ei.tipo_comprobante = 'I'
          AND (ei.sat_status IS NULL OR ei.sat_status <> 'Cancelado')
          AND (
            ei.sat_status = 'Vigente'
            OR ei.stamp_status IN ('stamped', 'cancel_pending', 'cancel_error')
          )
      )`).andWhere(`NOT EXISTS (
        SELECT 1 FROM global_invoice_orders gio
        INNER JOIN global_invoices gi ON gi.id = gio.global_invoice_id
        WHERE gio.sales_order_id = so.id
          AND gi.tenant_id = so.tenant_id
          AND gi.status IN ('pending', 'active')
      )`);
    }

    return qb.getMany();
  }

  private async toRows(tenantId: string, orders: SalesOrder[]): Promise<GlobalInvoiceOrderRow[]> {
    if (!orders.length) return [];
    const ids = orders.map((order) => order.id);
    const [payments, collections] = await Promise.all([
      this.paymentRepo.find({ where: { tenant_id: tenantId, sales_order_id: In(ids) } }),
      this.collectionRepo.find({ where: { tenant_id: tenantId, sales_order_id: In(ids) } }),
    ]);
    const paymentsByOrder = new Map<string, SalesOrderPayment[]>();
    for (const payment of payments) {
      const list = paymentsByOrder.get(payment.sales_order_id) ?? [];
      list.push(payment);
      paymentsByOrder.set(payment.sales_order_id, list);
    }
    const collectionByOrder = new Map(collections.map((item) => [item.sales_order_id, item]));

    return orders.map((order) => {
      const display = buildSalesOrderPaymentDisplay({
        collection: collectionByOrder.get(order.id) ?? null,
        payments: paymentsByOrder.get(order.id) ?? [],
        isCredit: order.is_credit,
      });
      const names = customerLabels(order);
      const branch = order.billing_branch;
      return {
        id: order.id,
        folio: order.folio,
        created_at: toIso(order.created_at),
        customer_name: names.name,
        company_name: names.company,
        branch_label: branch ? `${branch.city} (${branch.code})` : null,
        general_status: order.general_status,
        payment_status: order.payment_status,
        currency: (order.currency || 'MXN').toUpperCase(),
        subtotal: round2(Number(order.subtotal) || 0),
        iva_total: round2(Number(order.iva_total) || 0),
        ieps_total: round2(Number(order.ieps_total) || 0),
        discount_total: round2(Number(order.discount_total) || 0),
        total: round2(Number(order.total) || 0),
        payment_method: display.payment_method,
        payment_method_label: display.payment_method_label,
        payment_breakdown_label: display.payment_breakdown_label,
        payment_lines: display.lines,
      };
    });
  }

  private async paymentSnapshots(
    tenantId: string,
    orders: SalesOrder[],
  ): Promise<
    Array<{
      payment_status: string;
      payment_method: string | null;
      lines: Array<{ method: string }>;
    }>
  > {
    const rows = await this.toRows(tenantId, orders);
    return rows.map((row) => ({
      payment_status: row.payment_status,
      payment_method: row.payment_method,
      lines: row.payment_lines,
    }));
  }

  private assertSelection(orders: SalesOrder[], orderIds: string[]): void {
    const current = new Set(orders.map((order) => order.id));
    const wanted = new Set(orderIds);
    const same = current.size === wanted.size && [...current].every((id) => wanted.has(id));
    if (!same) {
      throw new BadRequestException(
        'Selecciona todas las órdenes sin facturar de esta sucursal. La lista cambió: vuelve a cargarla.',
      );
    }
  }

  private singleCurrency(orders: SalesOrder[]): string {
    const currencies = [...new Set(orders.map((order) => (order.currency || 'MXN').toUpperCase()))];
    if (currencies.length !== 1) {
      throw new BadRequestException(
        'Esta sucursal tiene órdenes en pesos y en dólares. La factura a público en general es un solo comprobante y solo puede llevar una moneda.',
      );
    }
    return currencies[0];
  }

  private exchangeRate(orders: SalesOrder[], currency: string): number | null {
    if (currency === 'MXN') return null;
    const missing = orders.find((order) => !(Number(order.exchange_rate) > 0));
    if (missing) {
      throw new BadRequestException(`La orden ${missing.folio} no tiene tipo de cambio.`);
    }
    return Number(orders[orders.length - 1].exchange_rate);
  }

  private lugarExpedicion(branch: BillingBranch): string {
    const postal = fiveDigitPostalCode(branch.postal_code);
    if (postal) return postal;
    throw new BadRequestException(
      'La sucursal no tiene código postal de 5 dígitos para expedir la factura.',
    );
  }

  private async nextFolio(
    tenantId: string,
    fiscalConfigurationId: string,
    period: GlobalInvoicePeriod,
  ): Promise<string> {
    const taken = await this.globalRepo.count({
      where: {
        tenant_id: tenantId,
        fiscal_configuration_id: fiscalConfigurationId,
        period_year: period.year,
        period_month: period.month,
      },
    });
    const mm = String(period.month).padStart(2, '0');
    return taken === 0 ? `${period.year}${mm}` : `${period.year}${mm}-${taken + 1}`;
  }

  private async listBranches(tenantId: string, includeId?: string): Promise<BillingBranch[]> {
    const branches = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoinAndSelect('branch.fiscal_configuration', 'fiscal')
      .where('fiscal.tenant_id = :tenantId', { tenantId })
      .andWhere('branch.status = :status', { status: 1 })
      .orderBy('branch.city', 'ASC')
      .addOrderBy('branch.code', 'ASC')
      .getMany();

    if (includeId && !branches.some((branch) => branch.id === includeId)) {
      const extra = await this.branchRepo.findOne({
        where: { id: includeId },
        relations: { fiscal_configuration: true },
      });
      if (extra?.fiscal_configuration?.tenant_id === tenantId) {
        branches.unshift(extra);
      }
    }
    return branches;
  }

  private branchOptions(branches: BillingBranch[]): GlobalInvoiceBranchOption[] {
    const fiscals = new Set(branches.map((branch) => branch.fiscal_configuration_id));
    const showRfc = fiscals.size > 1;
    return branches.map((branch) => ({
      id: branch.id,
      label: this.branchLabel(branch, showRfc),
      fiscal_configuration_id: branch.fiscal_configuration_id,
    }));
  }

  private branchLabel(branch: BillingBranch, showRfc: boolean): string {
    const place = `${branch.city} (${branch.code})`;
    const rfc = branch.fiscal_configuration?.rfc?.trim();
    return showRfc && rfc ? `${place} · ${rfc}` : place;
  }

  private emptyPage(
    period: GlobalInvoicePeriod,
    branches: GlobalInvoiceBranchOption[],
    blocked: string,
  ): GlobalInvoicePage {
    return {
      month: `${period.year}-${String(period.month).padStart(2, '0')}`,
      period_label: period.label,
      branches,
      billing_branch_id: null,
      fiscal_configuration_id: null,
      invoice: null,
      cancelled_invoice: null,
      orders: [],
      orders_count: 0,
      orders_total: null,
      currency: null,
      can_generate: false,
      blocked_reason: blocked,
      policy: null,
    };
  }

  private async branchIdOfInvoice(globalInvoiceId: string): Promise<string | undefined> {
    const rows: Array<{ billing_branch_id: string | null }> = await this.globalRepo.query(
      `SELECT so.billing_branch_id
       FROM global_invoice_orders gio
       INNER JOIN inv_s_sales_orders so ON so.id = gio.sales_order_id
       WHERE gio.global_invoice_id = ?
         AND so.billing_branch_id IS NOT NULL
       LIMIT 1`,
      [globalInvoiceId],
    );
    return rows[0]?.billing_branch_id ?? undefined;
  }

  private conceptLines(orders: SalesOrder[], fiscal: FiscalConfiguration): SelfInvoiceCfdiLine[] {
    const ivaOn = isFiscalFlagOn(fiscal.iva_enabled, true);
    const iepsOn = isFiscalFlagOn(fiscal.ieps_enabled, true);
    const lines: SelfInvoiceCfdiLine[] = [];
    for (const order of orders) {
      const raw = (order.line_items ?? []).filter((line) => Number(line.quantity) > 0);
      if (!raw.length) {
        throw new BadRequestException(`La orden ${order.folio} no tiene partidas para facturar`);
      }
      const gross = raw.reduce(
        (sum, line) => sum + Number(line.quantity) * Number(line.unit_price),
        0,
      );
      const extra = Number(order.global_discount_amount) || 0;
      for (const line of raw) {
        lines.push(conceptFromLine(order.folio, line, extra, gross, ivaOn, iepsOn));
      }
    }
    return lines;
  }

  private async toCard(
    tenantId: string,
    row: GlobalInvoice | null,
  ): Promise<GlobalInvoiceCard | null> {
    if (!row) return null;
    const invoice = row.electronic_invoice_id
      ? await this.invoiceRepo.findOne({
          where: { id: row.electronic_invoice_id, tenant_id: tenantId },
        })
      : null;
    const vigente = invoice ? this.electronicInvoiceService.isCfdiVigente(invoice) : false;
    return {
      id: row.id,
      status: row.status,
      electronic_invoice_id: invoice?.id ?? row.electronic_invoice_id,
      series: invoice?.series ?? null,
      folio: invoice?.folio ?? null,
      uuid: invoice?.uuid ?? null,
      subtotal: round2(Number(invoice?.subtotal) || 0),
      total: round2(Number(invoice?.total) || 0),
      currency: (invoice?.currency || 'MXN').toUpperCase(),
      stamp_status: invoice?.stamp_status ?? null,
      sat_status: invoice?.sat_status ?? null,
      can_cancel: row.status === 'active' && vigente && invoice?.stamp_status !== 'cancel_pending',
      process_folio: row.process_folio ?? null,
    };
  }

  private async appendProcessNote(
    tenantId: string,
    orderIds: string[],
    folio: string,
  ): Promise<void> {
    if (!orderIds.length) return;
    const line = `Factura a público en general automática. Folio del proceso: ${folio}.`;
    const marks = orderIds.map(() => '?').join(', ');
    try {
      await this.salesOrderRepo.query(
        `UPDATE inv_s_sales_orders
         SET notes = CASE
           WHEN notes IS NULL OR TRIM(notes) = '' THEN ?
           WHEN notes LIKE ? THEN notes
           ELSE CONCAT(notes, CHAR(10), ?)
         END
         WHERE tenant_id = ? AND id IN (${marks})`,
        [line, `%${folio}%`, line, tenantId, ...orderIds],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo anotar el folio';
      this.logger.warn(`Folio ${folio} no quedó en las notas: ${message}`);
    }
  }

  private isDuplicate(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = (error as QueryFailedError & { driverError?: { errno?: number; code?: string } })
      .driverError;
    return driver?.errno === 1062 || driver?.code === 'ER_DUP_ENTRY';
  }
}

function conceptFromLine(
  folio: string,
  line: SalesOrderDetail,
  globalDiscount: number,
  gross: number,
  ivaOn: boolean,
  iepsOn: boolean,
): SelfInvoiceCfdiLine {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unit_price) || 0;
  const share = gross > 0 ? ((qty * price) / gross) * globalDiscount : 0;
  const extraUnit = qty > 0 ? share / qty : 0;
  const name = line.custom_description?.trim() || line.product?.name || 'PRODUCTO';
  return {
    identifier: folio,
    description: `${folio} · ${name}`.slice(0, 1000),
    quantity: qty,
    unitPrice: price,
    discountUnit: (Number(line.discount_unit) || 0) + extraUnit,
    ivaPercentage: ivaOn ? Number(line.iva_percentage) || 0 : 0,
    iepsPercentage: iepsOn ? Number(line.ieps_percentage) || 0 : 0,
    satClave: line.product?.sat_clave,
    uomName: line.product_uom?.uom?.name,
  };
}

function customerLabels(order: SalesOrder): { name: string; company: string | null } {
  const walkIn = order.walk_in_name?.trim();
  const company = order.customer?.company_name?.trim() || null;
  const person = [order.customer?.name, order.customer?.lastname].filter(Boolean).join(' ').trim();
  if (walkIn) {
    return { name: walkIn, company: company && company !== walkIn ? company : null };
  }
  if (person && company && person !== company) {
    return { name: person, company };
  }
  return {
    name: person || company || formatCustomerDisplayName(order.customer) || 'Público en general',
    company: null,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}
