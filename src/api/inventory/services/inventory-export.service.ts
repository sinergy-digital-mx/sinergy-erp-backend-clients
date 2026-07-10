import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import {
  QueryInventoryBatchExportDto,
  QueryInventorySummaryExportDto,
} from '../dto/query-inventory-export.dto';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDate,
  formatExportDateTime,
  num,
} from '../../../common/utils/excel-export.util';

@Injectable()
export class InventoryExportService {
  private readonly batchColumns: ExcelColumnDef[] = [
    { header: 'No. lote', key: 'batch_number', width: 16 },
    { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
    { header: 'SKU', key: 'product_sku', width: 14 },
    { header: 'Producto', key: 'product_name', width: 28 },
    { header: 'Almacén', key: 'warehouse_name', width: 22 },
    { header: 'UOM', key: 'uom_name', width: 12 },
    { header: 'Cant. inicial', key: 'initial_quantity', width: 14, type: 'number' },
    { header: 'Cant. disponible', key: 'available_quantity', width: 14, type: 'number' },
    { header: 'Folio OC', key: 'purchase_order_folio', width: 14 },
    { header: 'Etiqueta origen', key: 'source_tag_identifier', width: 18 },
  ];

  private readonly summaryColumns: ExcelColumnDef[] = [
    { header: 'SKU', key: 'product_sku', width: 14 },
    { header: 'Producto', key: 'product_name', width: 28 },
    { header: 'Almacén', key: 'warehouse_name', width: 22 },
    { header: 'UOM', key: 'uom_name', width: 12 },
    { header: 'Cant. disponible', key: 'total_available_quantity', width: 16, type: 'number' },
    { header: 'Cant. inicial', key: 'total_initial_quantity', width: 14, type: 'number' },
    { header: 'No. lotes', key: 'total_batches', width: 12, type: 'integer' },
    { header: 'Precio sugerido', key: 'suggested_unit_price', width: 14, type: 'currency' },
  ];

  constructor(
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
  ) {}

  async exportBatches(tenantId: string, filters: QueryInventoryBatchExportDto): Promise<Buffer> {
    const batches = await this.fetchBatches(tenantId, filters);

    const rows = batches.map((batch) => ({
      batch_number: batch.batch_number,
      created_at: formatExportDateTime(batch.created_at),
      product_sku: batch.product?.sku ?? '',
      product_name: batch.product?.name ?? '',
      warehouse_name: batch.warehouse?.name ?? '',
      uom_name: batch.uom?.name ?? '',
      initial_quantity: num(batch.initial_quantity),
      available_quantity: num(batch.available_quantity),
      purchase_order_folio: batch.purchase_order_batch?.folio ?? '',
      source_tag_identifier: batch.source_tag_identifier ?? '',
    }));

    return buildStyledExcelBuffer({
      sheetName: 'Lotes',
      title: 'Reporte de inventario — Por lote',
      subtitle: buildExportSubtitle([
        `Generado: ${formatExportDateTime(new Date())}`,
        `Registros: ${rows.length}`,
        this.describeBatchFilters(filters),
      ]),
      columns: this.batchColumns,
      rows,
      headerColor: 'FF2E6B9E',
      titleColor: 'FF1E4A6E',
    });
  }

  async exportSummary(tenantId: string, filters: QueryInventorySummaryExportDto): Promise<Buffer> {
    const summaries = await this.buildSummaryRows(tenantId, filters);

    return buildStyledExcelBuffer({
      sheetName: 'Totalizado',
      title: 'Reporte de inventario — Totalizado',
      subtitle: buildExportSubtitle([
        `Generado: ${formatExportDateTime(new Date())}`,
        `Productos: ${summaries.length}`,
        this.describeSummaryFilters(filters),
      ]),
      columns: this.summaryColumns,
      rows: summaries,
      headerColor: 'FF3A7CA5',
      titleColor: 'FF255A7A',
    });
  }

  getBatchesFilename(): string {
    return `inventario-lotes-${this.todaySuffix()}.xlsx`;
  }

  getSummaryFilename(): string {
    return `inventario-totalizado-${this.todaySuffix()}.xlsx`;
  }

  private async fetchBatches(
    tenantId: string,
    filters: QueryInventoryBatchExportDto,
  ): Promise<InventoryBatch[]> {
    const qb = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.warehouse', 'warehouse')
      .leftJoinAndSelect('batch.uom', 'uom')
      .leftJoinAndSelect('batch.purchase_order_batch', 'purchase_order_batch')
      .where('batch.tenant_id = :tenantId', { tenantId });

    this.applyBatchFilters(qb, filters);

    const sortBy =
      filters.sort_by === 'quantity' ? 'available_quantity' : (filters.sort_by || 'created_at');
    const sortOrder = filters.sort_order || 'DESC';
    qb.orderBy(`batch.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    return qb.getMany();
  }

  private applyBatchFilters(
    qb: SelectQueryBuilder<InventoryBatch>,
    filters: QueryInventoryBatchExportDto,
  ): void {
    if (filters.search) {
      qb.andWhere(
        '(LOWER(batch.batch_number) LIKE LOWER(:search) OR LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.batch_number) {
      qb.andWhere('LOWER(batch.batch_number) LIKE LOWER(:batch_number)', {
        batch_number: `%${filters.batch_number}%`,
      });
    }
    if (filters.product_id) {
      qb.andWhere('batch.product_id = :product_id', { product_id: filters.product_id });
    }
    if (filters.warehouse_id) {
      qb.andWhere('batch.warehouse_id = :warehouse_id', { warehouse_id: filters.warehouse_id });
    }
    if (filters.purchase_order_batch_id) {
      qb.andWhere('batch.purchase_order_batch_id = :purchase_order_batch_id', {
        purchase_order_batch_id: filters.purchase_order_batch_id,
      });
    }
    if (filters.purchase_order_id) {
      qb.andWhere('batch.purchase_order_batch_id = :purchase_order_id', {
        purchase_order_id: filters.purchase_order_id,
      });
    }
    if (filters.created_from) {
      qb.andWhere('batch.created_at >= :created_from', {
        created_from: new Date(filters.created_from),
      });
    }
    if (filters.created_to) {
      qb.andWhere('batch.created_at <= :created_to', {
        created_to: new Date(filters.created_to),
      });
    }
  }

  private async buildSummaryRows(
    tenantId: string,
    filters: QueryInventorySummaryExportDto,
  ): Promise<Record<string, unknown>[]> {
    let qb = this.batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.warehouse', 'warehouse')
      .leftJoinAndSelect('batch.uom', 'uom')
      .where('batch.tenant_id = :tenantId', { tenantId });

    if (filters.search) {
      qb = qb.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.warehouse_id) {
      qb = qb.andWhere('batch.warehouse_id = :warehouse_id', {
        warehouse_id: filters.warehouse_id,
      });
    }
    if (filters.product_id) {
      qb = qb.andWhere('batch.product_id = :product_id', {
        product_id: filters.product_id,
      });
    }
    if (filters.only_available) {
      qb = qb.andWhere('batch.available_quantity > 0');
    }

    const batches = await qb.getMany();
    const grouped = new Map<string, InventoryBatch[]>();

    for (const batch of batches) {
      const key = `${batch.product_id}|${batch.warehouse_id}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(batch);
    }

    const rows: Record<string, unknown>[] = [];
    for (const batchGroup of grouped.values()) {
      const first = batchGroup[0];
      const totalAvailable = batchGroup.reduce(
        (sum, b) => sum + num(b.available_quantity),
        0,
      );
      const totalInitial = batchGroup.reduce((sum, b) => sum + num(b.initial_quantity), 0);

      rows.push({
        product_sku: first.product?.sku ?? '',
        product_name: first.product?.name ?? '',
        warehouse_name: first.warehouse?.name ?? '',
        uom_name: first.uom?.name ?? '',
        total_available_quantity: totalAvailable,
        total_initial_quantity: totalInitial,
        total_batches: batchGroup.length,
        suggested_unit_price: null,
      });
    }

    const sortBy = filters.sort_by || 'product_name';
    const sortOrder = filters.sort_order || 'ASC';
    rows.sort((a, b) => {
      let valA: string | number = String(a[sortBy === 'total_available_quantity' ? 'total_available_quantity' : sortBy] ?? '');
      let valB: string | number = String(b[sortBy === 'total_available_quantity' ? 'total_available_quantity' : sortBy] ?? '');

      if (sortBy === 'total_available_quantity') {
        valA = num(valA);
        valB = num(valB);
      } else if (sortBy === 'product_sku') {
        valA = String(a.product_sku);
        valB = String(b.product_sku);
      } else if (sortBy === 'warehouse_name') {
        valA = String(a.warehouse_name);
        valB = String(b.warehouse_name);
      } else {
        valA = String(a.product_name);
        valB = String(b.product_name);
      }

      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    return rows;
  }

  private describeBatchFilters(filters: QueryInventoryBatchExportDto): string {
    const parts: string[] = [];
    if (filters.search) parts.push(`Búsqueda: ${filters.search}`);
    if (filters.batch_number) parts.push(`Lote: ${filters.batch_number}`);
    if (filters.warehouse_id) parts.push('Almacén filtrado');
    if (filters.product_id) parts.push('Producto filtrado');
    if (filters.created_from || filters.created_to) {
      parts.push(
        `Fechas: ${filters.created_from ? formatExportDate(filters.created_from) : '…'} — ${filters.created_to ? formatExportDate(filters.created_to) : '…'}`,
      );
    }
    return parts.join(' | ');
  }

  private describeSummaryFilters(filters: QueryInventorySummaryExportDto): string {
    const parts: string[] = [];
    if (filters.search) parts.push(`Búsqueda: ${filters.search}`);
    if (filters.warehouse_id) parts.push('Almacén filtrado');
    if (filters.product_id) parts.push('Producto filtrado');
    if (filters.only_available) parts.push('Solo con existencia');
    return parts.join(' | ');
  }

  private todaySuffix(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
