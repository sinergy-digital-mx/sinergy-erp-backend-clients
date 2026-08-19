import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import {
  QuerySalesOrderDetailExportDto,
  QuerySalesOrderHeaderExportDto,
} from '../dto/query-sales-order-export.dto';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDate,
  formatExportDateTime,
  num,
  validateDateRange,
} from '../../../common/utils/excel-export.util';

@Injectable()
export class SalesOrderExportService {
  private readonly headerColumns: ExcelColumnDef[] = [
    { header: 'Folio', key: 'folio', width: 14 },
    { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
    { header: 'Tipo', key: 'sales_order_type', width: 10 },
    { header: 'Estado', key: 'general_status', width: 12 },
    { header: 'Pago', key: 'payment_status', width: 12 },
    { header: 'Crédito', key: 'is_credit', width: 12 },
    { header: 'Cliente', key: 'customer_name', width: 28 },
    { header: 'Razón social', key: 'razon_social', width: 28 },
    { header: 'Sucursal', key: 'billing_branch_code', width: 24 },
    { header: 'Entrega esperada', key: 'expected_delivery_date', width: 14, type: 'date' },
    { header: 'Subtotal', key: 'subtotal', width: 14, type: 'currency' },
    { header: 'Descuento', key: 'discount_total', width: 12, type: 'currency' },
    { header: 'IVA', key: 'iva_total', width: 12, type: 'currency' },
    { header: 'IEPS', key: 'ieps_total', width: 12, type: 'currency' },
    { header: 'Total', key: 'total', width: 14, type: 'currency' },
    { header: 'Vendedor', key: 'seller_name', width: 22 },
    { header: 'Notas', key: 'notes', width: 30 },
  ];

  private readonly detailColumns: ExcelColumnDef[] = [
    { header: 'Folio orden', key: 'folio', width: 14 },
    { header: 'Fecha orden', key: 'order_created_at', width: 18, type: 'date' },
    { header: 'Estado orden', key: 'general_status', width: 12 },
    { header: 'Pago', key: 'payment_status', width: 12 },
    { header: 'Crédito', key: 'is_credit', width: 12 },
    { header: 'Cliente', key: 'customer_name', width: 24 },
    { header: 'Razón social', key: 'razon_social', width: 26 },
    { header: 'Sucursal', key: 'billing_branch_code', width: 22 },
    { header: 'SKU', key: 'product_sku', width: 14 },
    { header: 'Producto', key: 'product_name', width: 28 },
    { header: 'UOM', key: 'uom_name', width: 12 },
    { header: 'Cantidad', key: 'quantity', width: 12, type: 'number' },
    { header: 'Precio unit.', key: 'unit_price', width: 14, type: 'currency' },
    { header: 'Desc. %', key: 'discount_percentage', width: 10, type: 'percent' },
    { header: 'Desc. unit.', key: 'discount_unit', width: 12, type: 'currency' },
    { header: 'Descuento', key: 'discount_name', width: 20 },
    { header: 'IVA %', key: 'iva_percentage', width: 10, type: 'percent' },
    { header: 'Subtotal línea', key: 'line_subtotal', width: 14, type: 'currency' },
    { header: 'Total línea', key: 'line_total', width: 14, type: 'currency' },
  ];

  constructor(
    @InjectRepository(SalesOrder)
    private readonly soRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderDetail)
    private readonly detailRepo: Repository<SalesOrderDetail>,
  ) {}

  async exportHeaders(tenantId: string, filters: QuerySalesOrderHeaderExportDto): Promise<Buffer> {
    const orders = await this.fetchOrders(tenantId, filters);
    const rows = orders.map((so) => ({
      folio: so.folio,
      created_at: formatExportDateTime(so.created_at),
      sales_order_type: so.sales_order_type,
      general_status: so.general_status,
      payment_status: so.payment_status,
      is_credit: so.is_credit ? 'Sí' : 'No',
      customer_name: this.formatCustomerName(so),
      razon_social: so.fiscal_configuration?.razon_social ?? so.fiscal_razon_social ?? '',
      billing_branch_code: so.warehouse?.billing_branch?.code ?? '',
      expected_delivery_date: formatExportDate(so.expected_delivery_date),
      subtotal: num(so.subtotal),
      discount_total: num(so.discount_total),
      iva_total: num(so.iva_total),
      ieps_total: num(so.ieps_total),
      total: num(so.total),
      seller_name: this.formatUserName(so.seller_user),
      notes: so.notes ?? '',
    }));

    return buildStyledExcelBuffer({
      sheetName: 'Cabeceras',
      title: 'Reporte de órdenes de venta — Cabeceras',
      subtitle: buildExportSubtitle([
        `Generado: ${formatExportDateTime(new Date())}`,
        `Registros: ${rows.length}`,
        this.describeFilters(filters),
      ]),
      columns: this.headerColumns,
      rows,
      headerColor: 'FF1B7F5E',
      titleColor: 'FF145A47',
    });
  }

  async exportDetails(tenantId: string, filters: QuerySalesOrderDetailExportDto): Promise<Buffer> {
    try {
      validateDateRange(filters.created_from, filters.created_to);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const details = await this.detailRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.sales_order', 'so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .leftJoinAndSelect('d.product', 'product')
      .leftJoinAndSelect('d.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .leftJoinAndSelect('d.product_discount', 'product_discount')
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere('so.created_at >= :from', { from: new Date(filters.created_from) })
      .andWhere('so.created_at <= :to', {
        to: this.endOfDay(new Date(filters.created_to)),
      })
      .orderBy('so.created_at', 'DESC')
      .addOrderBy('so.folio', 'ASC')
      .addOrderBy('d.created_at', 'ASC')
      .getMany();

    const filtered = this.applyDetailFilters(details, filters);

    const rows = filtered.map((d) => {
      const qty = num(d.quantity);
      const unitPrice = num(d.unit_price);
      const discountUnit = num(d.discount_unit);
      const lineSubtotal = qty * unitPrice;
      const lineTotal = lineSubtotal - discountUnit * qty;

      return {
        folio: d.sales_order?.folio ?? '',
        order_created_at: formatExportDateTime(d.sales_order?.created_at),
        general_status: d.sales_order?.general_status ?? '',
        payment_status: d.sales_order?.payment_status ?? '',
        is_credit: d.sales_order?.is_credit ? 'Sí' : 'No',
        customer_name: d.sales_order ? this.formatCustomerName(d.sales_order) : '',
        razon_social:
          d.sales_order?.fiscal_configuration?.razon_social ??
          d.sales_order?.fiscal_razon_social ??
          '',
        billing_branch_code: d.sales_order?.warehouse?.billing_branch?.code ?? '',
        product_sku: d.product?.sku ?? '',
        product_name: d.product?.name ?? '',
        uom_name: d.product_uom?.uom?.name ?? '',
        quantity: qty,
        unit_price: unitPrice,
        discount_percentage: num(d.discount_percentage),
        discount_unit: discountUnit,
        discount_name: d.product_discount?.name ?? '',
        iva_percentage: num(d.iva_percentage),
        line_subtotal: lineSubtotal,
        line_total: lineTotal,
      };
    });

    return buildStyledExcelBuffer({
      sheetName: 'Detalle',
      title: 'Reporte de órdenes de venta — Detalle de líneas',
      subtitle: buildExportSubtitle([
        `Periodo: ${formatExportDate(filters.created_from)} — ${formatExportDate(filters.created_to)}`,
        `Generado: ${formatExportDateTime(new Date())}`,
        `Líneas: ${rows.length}`,
        this.describeFilters(filters),
      ]),
      columns: this.detailColumns,
      rows,
      headerColor: 'FF2E8B57',
      titleColor: 'FF1F6049',
    });
  }

  getHeadersFilename(): string {
    return `ventas-cabeceras-${this.todaySuffix()}.xlsx`;
  }

  getDetailsFilename(from: string, to: string): string {
    return `ventas-detalle-${from}_${to}.xlsx`;
  }

  private async fetchOrders(
    tenantId: string,
    filters: QuerySalesOrderHeaderExportDto,
  ): Promise<SalesOrder[]> {
    const qb = this.soRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .leftJoinAndSelect('so.seller_user', 'seller_user')
      .where('so.tenant_id = :tenantId', { tenantId });

    this.applyOrderFilters(qb, filters);

    if (filters.created_from) {
      qb.andWhere('so.created_at >= :from', { from: new Date(filters.created_from) });
    }
    if (filters.created_to) {
      qb.andWhere('so.created_at <= :to', {
        to: this.endOfDay(new Date(filters.created_to)),
      });
    }

    qb.orderBy('so.created_at', 'DESC');
    return qb.getMany();
  }

  private applyOrderFilters(qb: ReturnType<Repository<SalesOrder>['createQueryBuilder']>, filters: QuerySalesOrderHeaderExportDto) {
    if (filters.search) {
      qb.andWhere(
        '(so.folio LIKE :s OR customer.name LIKE :s OR customer.lastname LIKE :s OR customer.company_name LIKE :s)',
        { s: `%${filters.search}%` },
      );
    }
    if (filters.general_status) {
      const statuses = Array.isArray(filters.general_status)
        ? filters.general_status
        : [filters.general_status];
      if (statuses.length === 1) {
        qb.andWhere('so.general_status = :general_status', {
          general_status: statuses[0],
        });
      } else if (statuses.length > 1) {
        qb.andWhere('so.general_status IN (:...general_statuses)', {
          general_statuses: statuses,
        });
      }
    }
    if (filters.payment_status) {
      qb.andWhere('so.payment_status = :payment_status', { payment_status: filters.payment_status });
    }
    if (typeof filters.is_credit === 'boolean') {
      qb.andWhere('so.is_credit = :is_credit', { is_credit: filters.is_credit });
    }
    if (filters.sales_order_type) {
      qb.andWhere('so.sales_order_type = :sales_order_type', {
        sales_order_type: filters.sales_order_type,
      });
    }
    if (filters.fiscal_configuration_id) {
      qb.andWhere('so.fiscal_configuration_id = :fiscal_configuration_id', {
        fiscal_configuration_id: filters.fiscal_configuration_id,
      });
    }
    if (filters.billing_branch_id) {
      qb.andWhere('warehouse.billing_branch_id = :billing_branch_id', {
        billing_branch_id: filters.billing_branch_id,
      });
    }
    if (filters.customer_id) {
      qb.andWhere('so.customer_id = :customer_id', { customer_id: filters.customer_id });
    }
  }

  private applyDetailFilters(
    details: SalesOrderDetail[],
    filters: QuerySalesOrderDetailExportDto,
  ): SalesOrderDetail[] {
    return details.filter((d) => {
      const so = d.sales_order;
      if (!so) return false;
      if (filters.general_status) {
        const statuses = Array.isArray(filters.general_status)
          ? filters.general_status
          : [filters.general_status];
        if (!statuses.includes(so.general_status)) return false;
      }
      if (filters.payment_status && so.payment_status !== filters.payment_status) return false;
      if (typeof filters.is_credit === 'boolean' && Boolean(so.is_credit) !== filters.is_credit) {
        return false;
      }
      if (filters.sales_order_type && so.sales_order_type !== filters.sales_order_type) return false;
      if (
        filters.fiscal_configuration_id &&
        so.fiscal_configuration_id !== filters.fiscal_configuration_id
      ) {
        return false;
      }
      if (
        filters.billing_branch_id &&
        so.warehouse?.billing_branch_id !== filters.billing_branch_id
      ) {
        return false;
      }
      if (filters.customer_id && so.customer_id !== filters.customer_id) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const haystack = [
          so.folio,
          so.customer?.name,
          so.customer?.lastname,
          so.customer?.company_name,
          d.product?.sku,
          d.product?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }

  private formatCustomerName(so: SalesOrder): string {
    const c = so.customer;
    if (!c) return '';
    if (c.company_name) return c.company_name;
    return [c.name, c.lastname].filter(Boolean).join(' ').trim();
  }

  private formatUserName(user?: { first_name?: string | null; last_name?: string | null } | null): string {
    if (!user) return '';
    return [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  }

  private describeFilters(filters: QuerySalesOrderHeaderExportDto): string {
    const parts: string[] = [];
    if (filters.created_from || filters.created_to) {
      parts.push(
        `Fechas: ${filters.created_from ? formatExportDate(filters.created_from) : '…'} — ${filters.created_to ? formatExportDate(filters.created_to) : '…'}`,
      );
    }
    if (filters.general_status) parts.push(`Estado: ${filters.general_status}`);
    if (filters.payment_status) parts.push(`Pago: ${filters.payment_status}`);
    if (typeof filters.is_credit === 'boolean') {
      parts.push(`Crédito: ${filters.is_credit ? 'Sí' : 'No'}`);
    }
    if (filters.sales_order_type) parts.push(`Tipo: ${filters.sales_order_type}`);
    if (filters.fiscal_configuration_id) parts.push('Razón social filtrada');
    if (filters.billing_branch_id) parts.push('Sucursal filtrada');
    if (filters.search) parts.push(`Búsqueda: ${filters.search}`);
    return parts.join(' | ');
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private todaySuffix(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
