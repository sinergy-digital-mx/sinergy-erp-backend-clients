import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import {
  QueryPurchaseOrderDetailExportDto,
  QueryPurchaseOrderHeaderExportDto,
} from '../dto/query-purchase-order-export.dto';
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
export class PurchaseOrderExportService {
  private readonly headerColumns: ExcelColumnDef[] = [
    { header: 'Folio', key: 'folio', width: 14 },
    { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
    { header: 'Proveedor', key: 'vendor_name', width: 28 },
    { header: 'Internacional', key: 'is_international', width: 14 },
    { header: 'Pedimento', key: 'pedimento_number', width: 18 },
    { header: 'Razón social', key: 'razon_social', width: 26 },
    { header: 'Sucursal', key: 'billing_branch_code', width: 22 },
    { header: 'Almacén', key: 'warehouse_name', width: 22 },
    { header: 'Estado', key: 'general_status', width: 12 },
    { header: 'Pago', key: 'payment_status', width: 12 },
    { header: 'Moneda', key: 'payment_currency', width: 10 },
    { header: 'Entrega esperada', key: 'expected_delivery_date', width: 14, type: 'date' },
    { header: 'Subtotal sol.', key: 'requested_subtotal', width: 14, type: 'currency' },
    { header: 'IVA sol.', key: 'requested_iva_total', width: 12, type: 'currency' },
    { header: 'IEPS sol.', key: 'requested_ieps_total', width: 12, type: 'currency' },
    { header: 'Total sol.', key: 'requested_total', width: 14, type: 'currency' },
    { header: 'Subtotal rec.', key: 'received_subtotal', width: 14, type: 'currency' },
    { header: 'Total rec.', key: 'received_total', width: 14, type: 'currency' },
    { header: 'Notas', key: 'notes', width: 30 },
  ];

  private readonly detailColumns: ExcelColumnDef[] = [
    { header: 'Folio orden', key: 'folio', width: 14 },
    { header: 'Fecha orden', key: 'order_created_at', width: 18, type: 'date' },
    { header: 'Estado orden', key: 'general_status', width: 12 },
    { header: 'Proveedor', key: 'vendor_name', width: 26 },
    { header: 'Razón social', key: 'razon_social', width: 24 },
    { header: 'Sucursal', key: 'billing_branch_code', width: 20 },
    { header: 'Almacén', key: 'warehouse_name', width: 20 },
    { header: 'SKU', key: 'product_sku', width: 14 },
    { header: 'Producto', key: 'product_name', width: 28 },
    { header: 'UOM', key: 'uom_name', width: 12 },
    { header: 'Cantidad', key: 'quantity', width: 12, type: 'number' },
    { header: 'Total unit.', key: 'unit_total', width: 14, type: 'currency' },
    { header: 'IVA %', key: 'iva_percentage', width: 10, type: 'percent' },
    { header: 'IEPS %', key: 'ieps_percentage', width: 10, type: 'percent' },
    { header: 'Subtotal línea', key: 'line_subtotal', width: 14, type: 'currency' },
  ];

  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly poRepo: Repository<PurchaseOrderBatch>,
    @InjectRepository(PurchaseOrderBatchDetail)
    private readonly detailRepo: Repository<PurchaseOrderBatchDetail>,
  ) {}

  async exportHeaders(tenantId: string, filters: QueryPurchaseOrderHeaderExportDto): Promise<Buffer> {
    const orders = await this.fetchOrders(tenantId, filters);
    const rows = orders.map((po) => ({
      folio: po.folio,
      created_at: formatExportDateTime(po.created_at),
      vendor_name: po.vendor?.name ?? po.vendor?.company_name ?? '',
      is_international: po.vendor?.vendor_type === 'INTERNATIONAL' ? 'Sí' : 'No',
      pedimento_number: po.vendor?.vendor_type === 'INTERNATIONAL' ? (po.pedimento_number ?? '') : '',
      razon_social: po.fiscal_configuration?.razon_social ?? '',
      billing_branch_code: po.warehouse?.billing_branch?.code ?? '',
      warehouse_name: po.warehouse?.name ?? '',
      general_status: po.general_status,
      payment_status: po.payment_status,
      payment_currency: po.payment_currency,
      expected_delivery_date: formatExportDate(po.expected_delivery_date),
      requested_subtotal: num(po.requested_subtotal),
      requested_iva_total: num(po.requested_iva_total),
      requested_ieps_total: num(po.requested_ieps_total),
      requested_total: num(po.requested_total),
      received_subtotal: num(po.received_subtotal),
      received_total: num(po.received_total),
      notes: po.notes ?? '',
    }));

    return buildStyledExcelBuffer({
      sheetName: 'Cabeceras',
      title: 'Reporte de órdenes de compra — Cabeceras',
      subtitle: buildExportSubtitle([
        `Generado: ${formatExportDateTime(new Date())}`,
        `Registros: ${rows.length}`,
        this.describeFilters(filters),
      ]),
      columns: this.headerColumns,
      rows,
      headerColor: 'FF5B4B8A',
      titleColor: 'FF3D3266',
    });
  }

  async exportDetails(tenantId: string, filters: QueryPurchaseOrderDetailExportDto): Promise<Buffer> {
    try {
      validateDateRange(filters.created_from, filters.created_to);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const details = await this.detailRepo
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.purchase_order_batch', 'po')
      .leftJoinAndSelect('po.vendor', 'vendor')
      .leftJoinAndSelect('po.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .leftJoinAndSelect('d.product', 'product')
      .leftJoinAndSelect('d.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .where('po.tenant_id = :tenantId', { tenantId })
      .andWhere('po.created_at >= :from', { from: new Date(filters.created_from) })
      .andWhere('po.created_at <= :to', {
        to: this.endOfDay(new Date(filters.created_to)),
      })
      .orderBy('po.created_at', 'DESC')
      .addOrderBy('po.folio', 'ASC')
      .addOrderBy('d.created_at', 'ASC')
      .getMany();

    const filtered = this.applyDetailFilters(details, filters);

    const rows = filtered.map((d) => {
      const qty = num(d.quantity);
      const unitTotal = num(d.unit_total);
      return {
        folio: d.purchase_order_batch?.folio ?? '',
        order_created_at: formatExportDateTime(d.purchase_order_batch?.created_at),
        general_status: d.purchase_order_batch?.general_status ?? '',
        vendor_name:
          d.purchase_order_batch?.vendor?.name ??
          d.purchase_order_batch?.vendor?.company_name ??
          '',
        razon_social: d.purchase_order_batch?.fiscal_configuration?.razon_social ?? '',
        billing_branch_code: d.purchase_order_batch?.warehouse?.billing_branch?.code ?? '',
        warehouse_name: d.purchase_order_batch?.warehouse?.name ?? '',
        product_sku: d.product?.sku ?? '',
        product_name: d.product?.name ?? '',
        uom_name: d.product_uom?.uom?.name ?? '',
        quantity: qty,
        unit_total: unitTotal,
        iva_percentage: num(d.iva_percentage),
        ieps_percentage: num(d.ieps_percentage),
        line_subtotal: qty * unitTotal,
      };
    });

    return buildStyledExcelBuffer({
      sheetName: 'Detalle',
      title: 'Reporte de órdenes de compra — Detalle de líneas',
      subtitle: buildExportSubtitle([
        `Periodo: ${formatExportDate(filters.created_from)} — ${formatExportDate(filters.created_to)}`,
        `Generado: ${formatExportDateTime(new Date())}`,
        `Líneas: ${rows.length}`,
        this.describeFilters(filters),
      ]),
      columns: this.detailColumns,
      rows,
      headerColor: 'FF6A5ACD',
      titleColor: 'FF4A3F7A',
    });
  }

  getHeadersFilename(): string {
    return `compras-cabeceras-${this.todaySuffix()}.xlsx`;
  }

  getDetailsFilename(from: string, to: string): string {
    return `compras-detalle-${from}_${to}.xlsx`;
  }

  private async fetchOrders(
    tenantId: string,
    filters: QueryPurchaseOrderHeaderExportDto,
  ): Promise<PurchaseOrderBatch[]> {
    const qb = this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.vendor', 'vendor')
      .leftJoinAndSelect('po.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('po.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .where('po.tenant_id = :tenantId', { tenantId });

    this.applyOrderFilters(qb, filters);

    if (filters.created_from) {
      qb.andWhere('po.created_at >= :from', { from: new Date(filters.created_from) });
    }
    if (filters.created_to) {
      qb.andWhere('po.created_at <= :to', {
        to: this.endOfDay(new Date(filters.created_to)),
      });
    }

    qb.orderBy('po.created_at', 'DESC');
    return qb.getMany();
  }

  private applyOrderFilters(
    qb: ReturnType<Repository<PurchaseOrderBatch>['createQueryBuilder']>,
    filters: QueryPurchaseOrderHeaderExportDto,
  ) {
    if (filters.general_status) {
      qb.andWhere('po.general_status = :general_status', {
        general_status: filters.general_status,
      });
    }
    if (filters.payment_status) {
      qb.andWhere('po.payment_status = :payment_status', {
        payment_status: filters.payment_status,
      });
    }
    if (filters.vendor_id) {
      qb.andWhere('po.vendor_id = :vendor_id', { vendor_id: filters.vendor_id });
    }
    if (filters.fiscal_configuration_id) {
      qb.andWhere('po.fiscal_configuration_id = :fiscal_configuration_id', {
        fiscal_configuration_id: filters.fiscal_configuration_id,
      });
    }
    if (filters.billing_branch_id) {
      qb.andWhere('warehouse.billing_branch_id = :billing_branch_id', {
        billing_branch_id: filters.billing_branch_id,
      });
    }
    if (filters.warehouse_id) {
      qb.andWhere('po.warehouse_id = :warehouse_id', { warehouse_id: filters.warehouse_id });
    }
    if (filters.search) {
      const rawSearch = filters.search.trim();
      const search = `%${rawSearch}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('po.folio LIKE :rawSearch', { rawSearch })
            .orWhere('LOWER(po.folio) LIKE LOWER(:search)', { search })
            .orWhere('LOWER(vendor.company_name) LIKE LOWER(:search)', { search });
        }),
      );
    }
  }

  private applyDetailFilters(
    details: PurchaseOrderBatchDetail[],
    filters: QueryPurchaseOrderDetailExportDto,
  ): PurchaseOrderBatchDetail[] {
    return details.filter((d) => {
      const po = d.purchase_order_batch;
      if (!po) return false;
      if (filters.general_status && po.general_status !== filters.general_status) return false;
      if (filters.payment_status && po.payment_status !== filters.payment_status) return false;
      if (filters.vendor_id && po.vendor_id !== filters.vendor_id) return false;
      if (
        filters.fiscal_configuration_id &&
        po.fiscal_configuration_id !== filters.fiscal_configuration_id
      ) {
        return false;
      }
      if (
        filters.billing_branch_id &&
        po.warehouse?.billing_branch_id !== filters.billing_branch_id
      ) {
        return false;
      }
      if (filters.warehouse_id && po.warehouse_id !== filters.warehouse_id) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const haystack = [
          po.folio,
          po.vendor?.name,
          po.vendor?.company_name,
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

  private describeFilters(filters: QueryPurchaseOrderHeaderExportDto): string {
    const parts: string[] = [];
    if (filters.created_from || filters.created_to) {
      parts.push(
        `Fechas: ${filters.created_from ? formatExportDate(filters.created_from) : '…'} — ${filters.created_to ? formatExportDate(filters.created_to) : '…'}`,
      );
    }
    if (filters.general_status) parts.push(`Estado: ${filters.general_status}`);
    if (filters.payment_status) parts.push(`Pago: ${filters.payment_status}`);
    if (filters.fiscal_configuration_id) parts.push('Razón social filtrada');
    if (filters.billing_branch_id) parts.push('Sucursal filtrada');
    if (filters.warehouse_id) parts.push('Almacén filtrado');
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
