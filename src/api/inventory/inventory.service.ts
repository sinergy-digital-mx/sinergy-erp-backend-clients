import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, In } from 'typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransferLine } from '../../entities/inventory/inventory-transfer-line.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductDiscount } from '../../entities/products/product-discount.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import {
  isProductDiscountApplicable,
  mapApplicableProductDiscount,
} from '../products/utils/product-discount.util';
import { User } from '../../entities/users/user.entity';
import { Warehouse } from '../../entities/warehouse/warehouse.entity';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { S3Service } from '../../common/services/s3.service';
import { BatchFilterDto } from './dto/batch-filter.dto';
import { BatchListResponseDto } from './dto/batch-list-response.dto';
import { BatchResponseDto } from './dto/batch-response.dto';
import { BatchDetailResponseDto } from './dto/batch-detail-response.dto';
import { InventorySummaryFilterDto } from './dto/inventory-summary-filter.dto';
import { InventorySummaryResponseDto, ProductInventorySummaryDto } from './dto/inventory-summary-response.dto';
import { PosSessionInventorySummaryResponseDto, PosSessionProductInventorySummaryDto } from './dto/pos-session-inventory-summary-response.dto';
import { InventoryLocationTreeResponseDto } from './dto/inventory-location-tree-response.dto';
import { InventoryStatsFilterDto } from './dto/inventory-stats-filter.dto';
import { InventoryStatsResponseDto } from './dto/inventory-stats-response.dto';
import {
  applyInventoryLocationFilters,
  assertInventoryLocationCascade,
  InventoryLocationQuery,
  joinInventoryLocation,
} from './utils/inventory-location-filter.util';

/** Costo unitario en UOM de inventario: precio OC × (qty original / qty convertida). */
const UNIT_COST_SQL = `(
  COALESCE(pod.received_original_unit_total, pod.unit_total, 0)
  * CASE
      WHEN pod.received_converted_quantity IS NOT NULL
       AND pod.received_converted_quantity > 0
       AND pod.received_original_quantity IS NOT NULL
       AND pod.received_original_quantity > 0
      THEN pod.received_original_quantity / pod.received_converted_quantity
      ELSE 1
    END
)`;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryBatch)
    private inventoryBatchRepo: Repository<InventoryBatch>,
    @InjectRepository(InventoryTransferLine)
    private readonly transferLineRepo: Repository<InventoryTransferLine>,
    @InjectRepository(ProductPrice)
    private readonly productPriceRepo: Repository<ProductPrice>,
    @InjectRepository(ProductDiscount)
    private readonly productDiscountRepo: Repository<ProductDiscount>,
    @InjectRepository(ProductUoM)
    private readonly productUomRepo: Repository<ProductUoM>,
    @InjectRepository(ProductVendorCost)
    private readonly productVendorCostRepo: Repository<ProductVendorCost>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalConfigRepo: Repository<FiscalConfiguration>,
    @InjectRepository(BillingBranch)
    private readonly billingBranchRepo: Repository<BillingBranch>,
    private readonly s3Service: S3Service,
  ) {}

  private async getSignedPhotoUrl(photoKey: string | null | undefined): Promise<string | null> {
    if (!photoKey) return null;
    return this.s3Service.getSignedUrl(photoKey, 900).catch(() => photoKey);
  }

  /** Árbol razón social → sucursal → almacén para los dropdowns de inventario. */
  async getLocationTree(tenantId: string): Promise<InventoryLocationTreeResponseDto> {
    const fiscals = await this.fiscalConfigRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });

    const branches = await this.billingBranchRepo
      .createQueryBuilder('branch')
      .innerJoin('branch.fiscal_configuration', 'fc')
      .where('fc.tenant_id = :tenantId', { tenantId })
      .orderBy('branch.code', 'ASC')
      .getMany();

    const warehouses = await this.warehouseRepo.find({
      where: { tenant_id: tenantId },
      order: { name: 'ASC' },
    });

    const warehousesByBranch = new Map<string, Warehouse[]>();
    for (const warehouse of warehouses) {
      if (!warehouse.billing_branch_id) continue;
      const list = warehousesByBranch.get(warehouse.billing_branch_id) ?? [];
      list.push(warehouse);
      warehousesByBranch.set(warehouse.billing_branch_id, list);
    }

    const branchesByFiscal = new Map<string, BillingBranch[]>();
    for (const branch of branches) {
      const list = branchesByFiscal.get(branch.fiscal_configuration_id) ?? [];
      list.push(branch);
      branchesByFiscal.set(branch.fiscal_configuration_id, list);
    }

    return {
      data: fiscals.map((fiscal) => ({
        id: fiscal.id,
        razon_social: fiscal.razon_social,
        rfc: fiscal.rfc,
        status: fiscal.status,
        branches: (branchesByFiscal.get(fiscal.id) ?? []).map((branch) => ({
          id: branch.id,
          name: branch.code,
          status: branch.status,
          warehouses: (warehousesByBranch.get(branch.id) ?? []).map((warehouse) => ({
            id: warehouse.id,
            name: warehouse.name,
            status: warehouse.status,
          })),
        })),
      })),
    };
  }

  /** KPIs de inventario para las cards del listado. Respeta la cascada de ubicación. */
  async getStats(
    tenantId: string,
    filters: InventoryStatsFilterDto,
  ): Promise<InventoryStatsResponseDto> {
    await this.assertLocationHierarchy(tenantId, filters);

    const totals = await this.buildStatsBaseQuery(tenantId, filters)
      .select('COUNT(batch.id)', 'total_batches')
      .addSelect(
        'SUM(CASE WHEN batch.available_quantity > 0 THEN 1 ELSE 0 END)',
        'batches_with_stock',
      )
      .addSelect('COUNT(DISTINCT batch.product_id)', 'total_products')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN batch.available_quantity > 0 THEN batch.product_id END)',
        'products_with_stock',
      )
      .addSelect('COUNT(DISTINCT batch.warehouse_id)', 'total_warehouses')
      .addSelect('COALESCE(SUM(batch.available_quantity), 0)', 'total_available_quantity')
      .addSelect('COALESCE(SUM(batch.initial_quantity), 0)', 'total_initial_quantity')
      .getRawOne();

    const byProductUom = await this.buildStatsBaseQuery(tenantId, filters)
      .andWhere('batch.available_quantity > 0')
      .select('batch.product_id', 'product_id')
      .addSelect('batch.uom_id', 'uom_id')
      .addSelect('COALESCE(SUM(batch.available_quantity), 0)', 'qty')
      .addSelect(
        `COALESCE(SUM(batch.available_quantity * ${UNIT_COST_SQL}), 0)`,
        'po_cost',
      )
      .addSelect(
        `COALESCE(SUM(CASE
          WHEN pod.id IS NOT NULL
           AND (pod.unit_total IS NOT NULL OR pod.received_original_unit_total IS NOT NULL)
          THEN batch.available_quantity ELSE 0 END), 0)`,
        'qty_with_po_cost',
      )
      .addSelect('COUNT(batch.id)', 'batches')
      .groupBy('batch.product_id')
      .addGroupBy('batch.uom_id')
      .getRawMany();

    const productIds = Array.from(new Set(byProductUom.map((row) => row.product_id).filter(Boolean)));
    const uomIds = Array.from(new Set(byProductUom.map((row) => row.uom_id).filter(Boolean)));
    const [priceMap, costMaps] = await Promise.all([
      this.buildPriceMap(productIds, uomIds),
      this.buildCostMap(productIds),
    ]);

    let totalSaleValue = 0;
    let totalCost = 0;
    let quantityWithoutPrice = 0;
    let productsWithoutPrice = 0;
    let batchesWithoutCost = 0;
    let quantityWithoutCost = 0;

    for (const row of byProductUom) {
      const qty = this.parseDecimal(row.qty);
      const poCost = this.parseDecimal(row.po_cost);
      const qtyWithPoCost = this.parseDecimal(row.qty_with_po_cost);
      const batches = this.parseIntSafe(row.batches);
      const suggested = priceMap.get(`${row.product_id}|${row.uom_id}`)?.[0];
      const unitPrice = suggested ? this.parseDecimal(suggested.price) : 0;
      const vendorUnitCost =
        costMaps.byProductUom.get(`${row.product_id}|${row.uom_id}`)
        ?? costMaps.byProduct.get(row.product_id)
        ?? 0;

      if (!suggested) {
        productsWithoutPrice += 1;
        quantityWithoutPrice += qty;
      }

      const qtyWithoutPoCost = Math.max(qty - qtyWithPoCost, 0);
      const lineCost = poCost + qtyWithoutPoCost * vendorUnitCost;
      totalSaleValue += qty * unitPrice;
      totalCost += lineCost;

      if (poCost <= 0 && vendorUnitCost <= 0) {
        batchesWithoutCost += batches;
        quantityWithoutCost += qty;
      }
    }

    const totalBatches = this.parseIntSafe(totals?.total_batches);
    const batchesWithStock = this.parseIntSafe(totals?.batches_with_stock);
    const totalAvailable = this.parseDecimal(totals?.total_available_quantity);
    const grossMargin = totalSaleValue - totalCost;

    return {
      total_batches: totalBatches,
      batches_with_stock: batchesWithStock,
      batches_depleted: Math.max(totalBatches - batchesWithStock, 0),
      total_products: this.parseIntSafe(totals?.total_products),
      products_with_stock: this.parseIntSafe(totals?.products_with_stock),
      total_warehouses: this.parseIntSafe(totals?.total_warehouses),
      total_available_quantity: this.formatQty(totalAvailable),
      total_initial_quantity: this.formatQty(this.parseDecimal(totals?.total_initial_quantity)),
      total_cost: this.formatMoney(totalCost),
      total_sale_value: this.formatMoney(totalSaleValue),
      average_unit_cost: this.formatMoney(totalAvailable > 0 ? totalCost / totalAvailable : 0),
      average_unit_price: this.formatMoney(totalAvailable > 0 ? totalSaleValue / totalAvailable : 0),
      gross_margin: this.formatMoney(grossMargin),
      gross_margin_percentage: this.formatMoney(
        totalSaleValue > 0 ? (grossMargin / totalSaleValue) * 100 : 0,
      ),
      batches_without_cost: batchesWithoutCost,
      quantity_without_cost: this.formatQty(quantityWithoutCost),
      products_without_price: productsWithoutPrice,
      quantity_without_price: this.formatQty(quantityWithoutPrice),
    };
  }

  private buildStatsBaseQuery(tenantId: string, filters: InventoryStatsFilterDto) {
    const query = this.inventoryBatchRepo
      .createQueryBuilder('batch')
      .leftJoin('batch.warehouse', 'warehouse')
      .leftJoin('warehouse.billing_branch', 'billing_branch')
      .leftJoin('billing_branch.fiscal_configuration', 'fiscal_configuration')
      .leftJoin('batch.purchase_order_detail', 'pod')
      .where('batch.tenant_id = :tenantId', { tenantId });

    applyInventoryLocationFilters(query, filters);
    return query;
  }

  private parseDecimal(value: unknown): number {
    const parsed = parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseIntSafe(value: unknown): number {
    const parsed = parseInt(String(value ?? 0), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private formatMoney(value: number): string {
    return (Number.isFinite(value) ? value : 0).toFixed(2);
  }

  private formatQty(value: number): string {
    return (Number.isFinite(value) ? value : 0).toFixed(3);
  }

  private mapLocationFields(warehouse?: Warehouse | null) {
    const branch = warehouse?.billing_branch ?? null;
    const fiscal = branch?.fiscal_configuration ?? null;

    return {
      fiscal_configuration_id: fiscal?.id ?? branch?.fiscal_configuration_id ?? null,
      razon_social: fiscal?.razon_social ?? null,
      billing_branch_id: warehouse?.billing_branch_id ?? null,
      sucursal: branch?.code ?? null,
    };
  }

  private async assertLocationHierarchy(
    tenantId: string,
    filters: InventoryLocationQuery,
  ): Promise<void> {
    assertInventoryLocationCascade(filters);

    if (filters.billing_branch_id && filters.fiscal_configuration_id) {
      const branch = await this.billingBranchRepo
        .createQueryBuilder('branch')
        .innerJoin('branch.fiscal_configuration', 'fc')
        .where('branch.id = :branchId', { branchId: filters.billing_branch_id })
        .andWhere('fc.id = :fiscalId', { fiscalId: filters.fiscal_configuration_id })
        .andWhere('fc.tenant_id = :tenantId', { tenantId })
        .getOne();

      if (!branch) {
        throw new BadRequestException(
          'La sucursal no pertenece a la razón social seleccionada',
        );
      }
    }

    if (filters.warehouse_id && filters.billing_branch_id) {
      const warehouse = await this.warehouseRepo.findOne({
        where: {
          id: filters.warehouse_id,
          tenant_id: tenantId,
          billing_branch_id: filters.billing_branch_id,
        },
      });

      if (!warehouse) {
        throw new BadRequestException(
          'El almacén no pertenece a la sucursal seleccionada',
        );
      }
    }
  }

  async getPosTerminalInventorySummary(
    tenantId: string,
    terminalUserId: string,
    filters: InventorySummaryFilterDto,
  ): Promise<PosSessionInventorySummaryResponseDto> {
    const terminalUser = await this.userRepo.findOne({
      where: { id: terminalUserId, tenant_id: tenantId, is_pos_user: true },
      relations: ['billing_branch'],
    });

    if (!terminalUser) {
      throw new NotFoundException('Usuario POS no encontrado');
    }

    if (!terminalUser.billing_branch_id) {
      throw new BadRequestException('El usuario POS no tiene una sucursal asignada');
    }

    const branchWarehouses = await this.warehouseRepo.find({
      where: { tenant_id: tenantId, billing_branch_id: terminalUser.billing_branch_id },
      select: ['id', 'name', 'status'],
      order: { name: 'ASC' },
    });

    if (branchWarehouses.length === 0) {
      throw new NotFoundException({
        message: 'No se encontraron almacenes para la sucursal de la terminal',
        billing_branch_id: terminalUser.billing_branch_id,
        warehouses: [],
      });
    }

    const availableWarehouseIds = new Set(branchWarehouses.map((w) => w.id));
    const selectedWarehouseId = filters.warehouse_id?.trim() || undefined;

    if (selectedWarehouseId && !availableWarehouseIds.has(selectedWarehouseId)) {
      throw new BadRequestException({
        message:
          'El almacén seleccionado no pertenece a la sucursal de esta terminal POS. Omita warehouse_id o use un almacén de la lista.',
        billing_branch_id: terminalUser.billing_branch_id,
        warehouses: branchWarehouses.map((w) => ({
          id: w.id,
          name: w.name,
          status: w.status,
        })),
      });
    }

    const targetWarehouseIds = selectedWarehouseId
      ? [selectedWarehouseId]
      : branchWarehouses.map((w) => w.id);

    let query = this.inventoryBatchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .leftJoinAndSelect('batch.warehouse', 'warehouse')
      .leftJoinAndSelect('batch.uom', 'uom')
      .leftJoinAndSelect('batch.purchase_order_batch', 'po')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.warehouse_id IN (:...warehouseIds)', { warehouseIds: targetWarehouseIds });

    if (filters.search) {
      query = query.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.product_id) {
      query = query.andWhere('batch.product_id = :product_id', {
        product_id: filters.product_id,
      });
    }

    if (filters.only_available) {
      query = query.andWhere('batch.available_quantity > 0');
    }

    const batches = await query.getMany();
    const grouped = new Map<string, InventoryBatch[]>();

    for (const batch of batches) {
      const key = `${batch.product_id}|${batch.uom_id}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(batch);
    }

    const productIds = Array.from(new Set(batches.map((b) => b.product_id)));
    const uomIds = Array.from(new Set(batches.map((b) => b.uom_id)));
    const priceMap = await this.buildPriceMap(productIds, uomIds);
    const productUomMap = await this.buildProductUomMap(productIds, uomIds);
    const discountsByProductId = await this.buildDiscountsByProductMap(productIds);

    const summaries: PosSessionProductInventorySummaryDto[] = [];

    for (const batchGroup of grouped.values()) {
      const first = batchGroup[0];
      const totalAvailable = batchGroup.reduce(
        (sum, b) => sum + parseFloat(b.available_quantity?.toString() ?? '0'),
        0,
      );
      const totalInitial = batchGroup.reduce(
        (sum, b) => sum + parseFloat(b.initial_quantity?.toString() ?? '0'),
        0,
      );
      const warehouseIds = Array.from(new Set(batchGroup.map((b) => b.warehouse_id)));
      const warehouseNames = Array.from(
        new Set(batchGroup.map((b) => b.warehouse?.name).filter((name): name is string => !!name)),
      );

      const priceKey = `${first.product_id}|${first.uom_id}`;
      const pricingOptions = priceMap.get(priceKey) || [];
      const suggestedPrice = pricingOptions[0] || null;
      const productUomId = productUomMap.get(priceKey) ?? '';
      const applicableDiscounts = (discountsByProductId.get(first.product_id) ?? [])
        .filter((discount) => productUomId && isProductDiscountApplicable(discount, productUomId))
        .map(mapApplicableProductDiscount);

      summaries.push({
        product_id: first.product_id,
        product_name: first.product?.name ?? '',
        product_sku: first.product?.sku ?? '',
        product_photo: await this.getSignedPhotoUrl(first.product?.photo),
        uom_id: first.uom_id,
        uom_name: first.uom?.name ?? '',
        warehouse_ids: warehouseIds,
        warehouse_names: warehouseNames,
        suggested_unit_price: suggestedPrice?.price ?? null,
        suggested_iva_percentage: suggestedPrice?.iva_percentage ?? null,
        suggested_ieps_percentage: suggestedPrice?.ieps_percentage ?? null,
        pricing_options: pricingOptions,
        product_uom_id: productUomId,
        has_applicable_discounts: applicableDiscounts.length > 0,
        applicable_discounts: applicableDiscounts,
        total_available_quantity: totalAvailable.toFixed(3),
        total_initial_quantity: totalInitial.toFixed(3),
        total_batches: batchGroup.length,
        batches: batchGroup.map((b) => ({
          batch_id: b.id,
          batch_number: b.batch_number,
          source_tag_identifier: b.source_tag_identifier ?? null,
          warehouse_id: b.warehouse_id,
          warehouse_name: b.warehouse?.name ?? '',
          available_quantity: parseFloat(b.available_quantity?.toString() ?? '0').toFixed(3),
          initial_quantity: parseFloat(b.initial_quantity?.toString() ?? '0').toFixed(3),
          purchase_order_folio: b.purchase_order_batch?.folio ?? null,
          created_at: b.created_at,
        })),
      });
    }

    const sortBy = filters.sort_by || 'product_name';
    const sortOrder = filters.sort_order || 'ASC';
    summaries.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;
      switch (sortBy) {
        case 'product_sku':
          valA = a.product_sku;
          valB = b.product_sku;
          break;
        case 'total_available_quantity':
          valA = parseFloat(a.total_available_quantity);
          valB = parseFloat(b.total_available_quantity);
          break;
        default:
          valA = a.product_name;
          valB = b.product_name;
      }
      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = summaries.length;
    const start = (page - 1) * limit;
    const paginatedData = summaries.slice(start, start + limit);

    return {
      billing_branch_id: terminalUser.billing_branch_id,
      fiscal_configuration_id:
        terminalUser.billing_branch?.fiscal_configuration_id ?? null,
      warehouses: branchWarehouses.map((w) => ({
        id: w.id,
        name: w.name,
        status: w.status,
      })),
      applied_warehouse_id: selectedWarehouseId ?? null,
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Costo promedio por producto/UOM desde product_vendor_costs (importación / proveedores).
   * byProductUom: costo en esa UOM. byProduct: costo convertido a UOM base (cost / factor).
   */
  private async buildCostMap(productIds: string[]): Promise<{
    byProductUom: Map<string, number>;
    byProduct: Map<string, number>;
  }> {
    const byProductUom = new Map<string, number>();
    const byProduct = new Map<string, number>();
    if (productIds.length === 0) {
      return { byProductUom, byProduct };
    }

    const costs = await this.productVendorCostRepo
      .createQueryBuilder('pvc')
      .leftJoinAndSelect('pvc.product_uom', 'product_uom')
      .where('pvc.product_id IN (:...productIds)', { productIds })
      .getMany();

    const exact: Map<string, number[]> = new Map();
    const base: Map<string, number[]> = new Map();

    for (const row of costs) {
      const cost = this.parseDecimal(row.cost);
      if (cost <= 0) continue;

      const catalogId = row.product_uom?.uom_catalog_id;
      const factor = this.parseDecimal(row.product_uom?.factor) || 1;

      if (catalogId) {
        const key = `${row.product_id}|${catalogId}`;
        const list = exact.get(key) ?? [];
        list.push(cost);
        exact.set(key, list);
      }

      const baseList = base.get(row.product_id) ?? [];
      baseList.push(cost / factor);
      base.set(row.product_id, baseList);
    }

    for (const [key, values] of exact) {
      byProductUom.set(key, this.average(values));
    }
    for (const [key, values] of base) {
      byProduct.set(key, this.average(values));
    }

    return { byProductUom, byProduct };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private async buildPriceMap(
    productIds: string[],
    uomIds: string[],
  ): Promise<
    Map<
      string,
      Array<{
        price_list_id: string;
        price_list_name: string;
        price: string;
        iva_percentage: string;
        ieps_percentage: string;
        total: string;
      }>
    >
  > {
    const priceMap = new Map<
      string,
      Array<{
        price_list_id: string;
        price_list_name: string;
        price: string;
        iva_percentage: string;
        ieps_percentage: string;
        total: string;
      }>
    >();

    if (productIds.length === 0 || uomIds.length === 0) {
      return priceMap;
    }

    const prices = await this.productPriceRepo
      .createQueryBuilder('pp')
      .leftJoinAndSelect('pp.price_list', 'price_list')
      .leftJoinAndSelect('pp.product_uom', 'product_uom')
      .where('pp.product_id IN (:...productIds)', { productIds })
      .andWhere('product_uom.uom_catalog_id IN (:...uomIds)', { uomIds })
      .andWhere('price_list.is_active = :isActive', { isActive: true })
      .orderBy('price_list.created_at', 'ASC')
      .addOrderBy('pp.created_at', 'ASC')
      .getMany();

    for (const price of prices) {
      const uomCatalogId = price.product_uom?.uom_catalog_id;
      if (!uomCatalogId) continue;

      const key = `${price.product_id}|${uomCatalogId}`;
      const options = priceMap.get(key) || [];
      options.push({
        price_list_id: price.price_list_id,
        price_list_name: price.price_list?.name ?? 'N/A',
        price: Number(price.price ?? 0).toFixed(2),
        iva_percentage: Number(price.iva_percentage ?? 0).toFixed(2),
        ieps_percentage: Number(price.ieps_percentage ?? 0).toFixed(2),
        total: Number(price.total ?? 0).toFixed(2),
      });
      priceMap.set(key, options);
    }

    return priceMap;
  }

  private async buildProductUomMap(
    productIds: string[],
    uomCatalogIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (productIds.length === 0 || uomCatalogIds.length === 0) {
      return map;
    }

    const productUoms = await this.productUomRepo
      .createQueryBuilder('pu')
      .where('pu.product_id IN (:...productIds)', { productIds })
      .andWhere('pu.uom_catalog_id IN (:...uomCatalogIds)', { uomCatalogIds })
      .getMany();

    for (const productUom of productUoms) {
      map.set(`${productUom.product_id}|${productUom.uom_catalog_id}`, productUom.id);
    }

    return map;
  }

  private async buildDiscountsByProductMap(
    productIds: string[],
  ): Promise<Map<string, ProductDiscount[]>> {
    const map = new Map<string, ProductDiscount[]>();
    if (productIds.length === 0) {
      return map;
    }

    const discounts = await this.productDiscountRepo.find({
      where: { product_id: In(productIds), is_active: true },
      order: { created_at: 'ASC' },
    });

    for (const discount of discounts) {
      const current = map.get(discount.product_id) ?? [];
      current.push(discount);
      map.set(discount.product_id, current);
    }

    return map;
  }

  /**
   * Find all batches with filtering and pagination
   * @param tenantId - Tenant ID for isolation
   * @param filters - Filter and pagination options
   * @returns Paginated list of batches
   */
  async findAll(
    tenantId: string,
    filters: BatchFilterDto,
  ): Promise<BatchListResponseDto> {
    try {
      this.logger.debug(
        `Finding all batches for tenant: ${tenantId}, filters: ${JSON.stringify(filters)}`,
      );

      await this.assertLocationHierarchy(tenantId, filters);
      return this.paginateBatches(tenantId, filters);
    } catch (error) {
      this.logger.error(
        `Error finding all batches for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a single batch by ID with all relations loaded
   * Returns enriched detail including quantity breakdown and movement summary
   * @param id - Batch ID
   * @param tenantId - Tenant ID for isolation
   * @returns Batch detail response DTO
   * @throws NotFoundException if batch not found
   */
  async findById(id: string, tenantId: string): Promise<BatchDetailResponseDto> {
    try {
      this.logger.debug(`Finding batch by ID: ${id} for tenant: ${tenantId}`);

      const batch = await this.inventoryBatchRepo
        .createQueryBuilder('batch')
        .where('batch.id = :id AND batch.tenant_id = :tenantId', { id, tenantId })
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('batch.warehouse', 'warehouse')
        .leftJoinAndSelect('batch.uom', 'uom')
        .leftJoinAndSelect('batch.purchase_order_batch', 'purchase_order_batch')
        .leftJoinAndSelect('batch.transferred_from_batch', 'transferred_from_batch');

      joinInventoryLocation(batch);

      const found = await batch.getOne();

      if (!found) {
        this.logger.warn(`Batch not found: ${id} for tenant: ${tenantId}`);
        throw new NotFoundException(`Batch not found: ${id}`);
      }

      this.logger.log(`Successfully retrieved batch: ${id}`);
      return this.mapToDetailResponseDto(found, await this.loadTransferHistory(found.id));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error finding batch ${id} for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all batches for a specific purchase order with pagination
   * @param poId - Purchase order ID
   * @param tenantId - Tenant ID for isolation
   * @param filters - Filter and pagination options
   * @returns Paginated list of batches for the purchase order
   */
  async findByPurchaseOrderId(
    poId: string,
    tenantId: string,
    filters: BatchFilterDto,
  ): Promise<BatchListResponseDto> {
    try {
      this.logger.debug(
        `Finding batches for purchase order: ${poId}, tenant: ${tenantId}, filters: ${JSON.stringify(filters)}`,
      );

      return this.paginateBatches(tenantId, filters, {
        extraWhere: (qb) => {
          qb.andWhere('batch.purchase_order_batch_id = :poId', { poId });
        },
        applyLocation: false,
      });
    } catch (error) {
      this.logger.error(
        `Error finding batches for purchase order ${poId}, tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate the total quantity from a list of batches
   * @param batches - Array of batch response DTOs
   * @returns Total quantity as a number
   */
  calculateTotalQuantity(batches: BatchResponseDto[]): number {
    try {
      if (!batches || batches.length === 0) {
        this.logger.debug('No batches provided for quantity calculation');
        return 0;
      }

      const totalQuantity = batches.reduce((sum, batch) => {
        const quantity = parseFloat(batch.quantity) || 0;
        return sum + quantity;
      }, 0);

      this.logger.debug(
        `Calculated total quantity: ${totalQuantity} from ${batches.length} batches`,
      );

      return totalQuantity;
    } catch (error) {
      this.logger.error(
        `Error calculating total quantity: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Map InventoryBatch entity to BatchResponseDto
   */
  private mapToResponseDto(batch: InventoryBatch): BatchResponseDto {
    return {
      id: batch.id,
      batch_number: batch.batch_number,
      source_tag_identifier: batch.source_tag_identifier ?? null,
      warehouse_id: batch.warehouse_id,
      warehouse_name: batch.warehouse?.name,
      ...this.mapLocationFields(batch.warehouse),
      product_id: batch.product_id,
      product_name: batch.product?.name,
      product_sku: batch.product?.sku,
      uom_id: batch.uom_id,
      uom_name: batch.uom?.name,
      quantity: batch.available_quantity.toString(),
      purchase_order_batch_id: batch.purchase_order_batch_id,
      purchase_order_id: batch.purchase_order_batch_id,
      purchase_order_detail_id: batch.purchase_order_detail_id,
      purchase_order_folio: batch.purchase_order_batch?.folio,
      created_by: batch.created_by,
      created_at: batch.created_at,
    };
  }

  private async paginateBatches(
    tenantId: string,
    filters: BatchFilterDto,
    options?: {
      extraWhere?: (qb: SelectQueryBuilder<InventoryBatch>) => void;
      applyLocation?: boolean;
    },
  ): Promise<BatchListResponseDto> {
    const applyLocation = options?.applyLocation !== false;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy =
      filters.sort_by === 'quantity' ? 'available_quantity' : (filters.sort_by || 'created_at');
    const sortOrder = (filters.sort_order || 'DESC') as 'ASC' | 'DESC';

    const countQb = this.createBatchesQuery(tenantId, filters, {
      hydrate: false,
      applyLocation,
      extraWhere: options?.extraWhere,
    });
    const dataQb = this.createBatchesQuery(tenantId, filters, {
      hydrate: true,
      applyLocation,
      extraWhere: options?.extraWhere,
    });
    dataQb.orderBy(`batch.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [total, data] = await Promise.all([countQb.getCount(), dataQb.getMany()]);
    const totalPages = Math.ceil(total / limit);

    this.logger.log(
      `Successfully retrieved ${data.length} batches out of ${total} total for tenant: ${tenantId}`,
    );

    return {
      data: data.map((batch) => this.mapToResponseDto(batch)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  private createBatchesQuery(
    tenantId: string,
    filters: BatchFilterDto,
    options: {
      hydrate: boolean;
      applyLocation: boolean;
      extraWhere?: (qb: SelectQueryBuilder<InventoryBatch>) => void;
    },
  ): SelectQueryBuilder<InventoryBatch> {
    const qb = this.inventoryBatchRepo
      .createQueryBuilder('batch')
      .where('batch.tenant_id = :tenantId', { tenantId });

    if (options.hydrate) {
      this.hydrateBatchListJoins(qb);
    } else {
      if (filters.search) {
        qb.leftJoin('batch.product', 'product');
      }
      if (options.applyLocation && (filters.fiscal_configuration_id || filters.billing_branch_id)) {
        qb.leftJoin('batch.warehouse', 'warehouse');
        if (filters.fiscal_configuration_id) {
          qb.leftJoin('warehouse.billing_branch', 'billing_branch');
        }
      }
    }

    options.extraWhere?.(qb);
    this.applyBatchFieldFilters(qb, filters, { applyLocation: options.applyLocation });
    return qb;
  }

  private hydrateBatchListJoins(qb: SelectQueryBuilder<InventoryBatch>): void {
    qb.leftJoin('batch.product', 'product')
      .addSelect(['product.id', 'product.name', 'product.sku'])
      .leftJoin('batch.warehouse', 'warehouse')
      .addSelect(['warehouse.id', 'warehouse.name', 'warehouse.billing_branch_id'])
      .leftJoin('warehouse.billing_branch', 'billing_branch')
      .addSelect([
        'billing_branch.id',
        'billing_branch.code',
        'billing_branch.fiscal_configuration_id',
      ])
      .leftJoin('billing_branch.fiscal_configuration', 'fiscal_configuration')
      .addSelect(['fiscal_configuration.id', 'fiscal_configuration.razon_social'])
      .leftJoin('batch.uom', 'uom')
      .addSelect(['uom.id', 'uom.name'])
      .leftJoin('batch.purchase_order_batch', 'purchase_order_batch')
      .addSelect(['purchase_order_batch.id', 'purchase_order_batch.folio']);
  }

  private applyBatchFieldFilters(
    qb: SelectQueryBuilder<InventoryBatch>,
    filters: BatchFilterDto,
    options: { applyLocation: boolean },
  ): void {
    if (options.applyLocation) {
      applyInventoryLocationFilters(qb, filters);
    } else if (filters.warehouse_id) {
      qb.andWhere('batch.warehouse_id = :warehouse_id', {
        warehouse_id: filters.warehouse_id,
      });
    }

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
      qb.andWhere('batch.product_id = :product_id', {
        product_id: filters.product_id,
      });
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

  /**
   * Get inventory summary grouped by product and warehouse.
   * Shows total available quantity and breakdown by batch.
   */
  async getInventorySummary(
    tenantId: string,
    filters: InventorySummaryFilterDto,
  ): Promise<InventorySummaryResponseDto> {
    try {
      this.logger.debug(`Getting inventory summary for tenant: ${tenantId}`);
      await this.assertLocationHierarchy(tenantId, filters);

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;
      const sortOrder = (filters.sort_order || 'ASC') as 'ASC' | 'DESC';
      const sortBy = filters.sort_by || 'product_name';
      const sortExpression =
        sortBy === 'product_sku'
          ? 'MAX(product.sku)'
          : sortBy === 'warehouse_name'
            ? 'MAX(warehouse.name)'
            : sortBy === 'total_available_quantity'
              ? 'SUM(batch.available_quantity)'
              : 'MAX(product.name)';

      const countQb = this.buildSummaryBaseQuery(tenantId, filters);
      const groupsQb = this.buildSummaryBaseQuery(tenantId, filters)
        .select('batch.product_id', 'product_id')
        .addSelect('batch.warehouse_id', 'warehouse_id')
        .addSelect('MAX(product.name)', 'product_name')
        .addSelect('MAX(product.sku)', 'product_sku')
        .addSelect('MAX(product.photo)', 'product_photo')
        .addSelect('MAX(warehouse.name)', 'warehouse_name')
        .addSelect('MAX(billing_branch.fiscal_configuration_id)', 'fiscal_configuration_id')
        .addSelect('MAX(fiscal_configuration.razon_social)', 'razon_social')
        .addSelect('MAX(warehouse.billing_branch_id)', 'billing_branch_id')
        .addSelect('MAX(billing_branch.code)', 'sucursal')
        .addSelect('MAX(batch.uom_id)', 'uom_id')
        .addSelect('MAX(uom.name)', 'uom_name')
        .addSelect('COALESCE(SUM(batch.available_quantity), 0)', 'total_available')
        .addSelect('COALESCE(SUM(batch.initial_quantity), 0)', 'total_initial')
        .addSelect('COUNT(batch.id)', 'total_batches')
        .groupBy('batch.product_id')
        .addGroupBy('batch.warehouse_id')
        .orderBy(sortExpression, sortOrder)
        .offset(skip)
        .limit(limit);

      const [totalRow, groups] = await Promise.all([
        countQb
          .select(
            "COUNT(DISTINCT CONCAT(batch.product_id, '|', batch.warehouse_id))",
            'total',
          )
          .getRawOne<{ total: string | number }>(),
        groupsQb.getRawMany<{
          product_id: string;
          warehouse_id: string;
          product_name: string;
          product_sku: string;
          product_photo: string | null;
          warehouse_name: string;
          fiscal_configuration_id: string | null;
          razon_social: string | null;
          billing_branch_id: string | null;
          sucursal: string | null;
          uom_id: string;
          uom_name: string;
          total_available: string | number;
          total_initial: string | number;
          total_batches: string | number;
        }>(),
      ]);

      const total = this.parseIntSafe(totalRow?.total);
      if (groups.length === 0) {
        return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) || 0 };
      }

      const batchesByGroup = await this.loadSummaryBatches(tenantId, filters, groups);
      const productIds = Array.from(new Set(groups.map((row) => row.product_id)));
      const uomIds = Array.from(new Set(groups.map((row) => row.uom_id).filter(Boolean)));
      const [priceMap, photoMap] = await Promise.all([
        this.buildPriceMap(productIds, uomIds),
        this.signPhotoMap(groups.map((row) => row.product_photo)),
      ]);

      const data: ProductInventorySummaryDto[] = groups.map((row) => {
        const key = `${row.product_id}|${row.warehouse_id}`;
        const pricingOptions = priceMap.get(`${row.product_id}|${row.uom_id}`) || [];
        const suggestedPrice = pricingOptions[0] || null;
        const photoKey = row.product_photo ?? null;

        return {
          product_id: row.product_id,
          product_name: row.product_name ?? '',
          product_sku: row.product_sku ?? '',
          product_photo: photoKey ? (photoMap.get(photoKey) ?? null) : null,
          warehouse_id: row.warehouse_id,
          warehouse_name: row.warehouse_name ?? '',
          fiscal_configuration_id: row.fiscal_configuration_id ?? null,
          razon_social: row.razon_social ?? null,
          billing_branch_id: row.billing_branch_id ?? null,
          sucursal: row.sucursal ?? null,
          uom_id: row.uom_id,
          uom_name: row.uom_name ?? '',
          suggested_unit_price: suggestedPrice?.price ?? null,
          suggested_iva_percentage: suggestedPrice?.iva_percentage ?? null,
          suggested_ieps_percentage: suggestedPrice?.ieps_percentage ?? null,
          pricing_options: pricingOptions,
          total_available_quantity: this.formatQty(this.parseDecimal(row.total_available)),
          total_initial_quantity: this.formatQty(this.parseDecimal(row.total_initial)),
          total_batches: this.parseIntSafe(row.total_batches),
          batches: batchesByGroup.get(key) ?? [],
        };
      });

      this.logger.log(`Inventory summary: ${data.length} products out of ${total} total`);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      };
    } catch (error) {
      this.logger.error(
        `Error getting inventory summary for tenant ${tenantId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private buildSummaryBaseQuery(
    tenantId: string,
    filters: InventorySummaryFilterDto,
  ): SelectQueryBuilder<InventoryBatch> {
    const qb = this.inventoryBatchRepo
      .createQueryBuilder('batch')
      .innerJoin('batch.product', 'product')
      .innerJoin('batch.warehouse', 'warehouse')
      .leftJoin('warehouse.billing_branch', 'billing_branch')
      .leftJoin('billing_branch.fiscal_configuration', 'fiscal_configuration')
      .leftJoin('batch.uom', 'uom')
      .where('batch.tenant_id = :tenantId', { tenantId });

    applyInventoryLocationFilters(qb, filters);

    if (filters.search) {
      qb.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.sku) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.product_id) {
      qb.andWhere('batch.product_id = :product_id', {
        product_id: filters.product_id,
      });
    }

    if (filters.only_available) {
      qb.andWhere('batch.available_quantity > 0');
    }

    return qb;
  }

  private async loadSummaryBatches(
    tenantId: string,
    filters: InventorySummaryFilterDto,
    groups: Array<{ product_id: string; warehouse_id: string }>,
  ) {
    const qb = this.inventoryBatchRepo
      .createQueryBuilder('batch')
      .leftJoin('batch.purchase_order_batch', 'po')
      .select('batch.id', 'batch_id')
      .addSelect('batch.product_id', 'product_id')
      .addSelect('batch.warehouse_id', 'warehouse_id')
      .addSelect('batch.batch_number', 'batch_number')
      .addSelect('batch.source_tag_identifier', 'source_tag_identifier')
      .addSelect('batch.available_quantity', 'available_quantity')
      .addSelect('batch.initial_quantity', 'initial_quantity')
      .addSelect('po.folio', 'purchase_order_folio')
      .addSelect('batch.created_at', 'created_at')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere(
        new Brackets((sub) => {
          groups.forEach((group, index) => {
            sub.orWhere(
              `(batch.product_id = :pid${index} AND batch.warehouse_id = :wid${index})`,
              {
                [`pid${index}`]: group.product_id,
                [`wid${index}`]: group.warehouse_id,
              },
            );
          });
        }),
      )
      .orderBy('batch.created_at', 'DESC');

    if (filters.only_available) {
      qb.andWhere('batch.available_quantity > 0');
    }

    const rows = await qb.getRawMany<{
      batch_id: string;
      product_id: string;
      warehouse_id: string;
      batch_number: string;
      source_tag_identifier: string | null;
      available_quantity: string | number;
      initial_quantity: string | number;
      purchase_order_folio: string | null;
      created_at: Date;
    }>();

    const map = new Map<
      string,
      Array<{
        batch_id: string;
        batch_number: string;
        source_tag_identifier: string | null;
        available_quantity: string;
        initial_quantity: string;
        purchase_order_folio: string | null;
        created_at: Date;
      }>
    >();

    for (const row of rows) {
      const key = `${row.product_id}|${row.warehouse_id}`;
      const list = map.get(key) ?? [];
      list.push({
        batch_id: row.batch_id,
        batch_number: row.batch_number,
        source_tag_identifier: row.source_tag_identifier ?? null,
        available_quantity: this.formatQty(this.parseDecimal(row.available_quantity)),
        initial_quantity: this.formatQty(this.parseDecimal(row.initial_quantity)),
        purchase_order_folio: row.purchase_order_folio ?? null,
        created_at: row.created_at,
      });
      map.set(key, list);
    }

    return map;
  }

  private async signPhotoMap(
    keys: Array<string | null | undefined>,
  ): Promise<Map<string, string | null>> {
    const unique = [...new Set(keys.filter((key): key is string => !!key))];
    const entries = await Promise.all(
      unique.map(async (key) => [key, await this.getSignedPhotoUrl(key)] as const),
    );
    return new Map(entries);
  }

  /**
   * Historial de transferencias donde este lote fue origen o destino.
   */
  private async loadTransferHistory(batchId: string) {
    const lines = await this.transferLineRepo
      .createQueryBuilder('line')
      .leftJoinAndSelect('line.inventory_transfer', 'transfer')
      .leftJoinAndSelect('line.source_inventory_batch', 'source_batch')
      .leftJoinAndSelect('line.destination_inventory_batch', 'dest_batch')
      .leftJoinAndSelect('transfer.source_warehouse', 'source_wh')
      .leftJoinAndSelect('transfer.destination_warehouse', 'dest_wh')
      .where('line.source_inventory_batch_id = :batchId', { batchId })
      .orWhere('line.destination_inventory_batch_id = :batchId', { batchId })
      .orderBy('line.created_at', 'DESC')
      .getMany();

    return lines.map((line) => {
      const isOut = line.source_inventory_batch_id === batchId;
      return {
        transfer_id: line.inventory_transfer_id,
        transfer_folio: line.inventory_transfer?.folio ?? '',
        direction: isOut ? ('out' as const) : ('in' as const),
        quantity: parseFloat(line.quantity?.toString() ?? '0').toFixed(3),
        related_batch_id: isOut
          ? line.destination_inventory_batch_id
          : line.source_inventory_batch_id,
        related_batch_number: isOut
          ? line.destination_inventory_batch?.batch_number ?? null
          : line.source_inventory_batch?.batch_number ?? null,
        warehouse_name: isOut
          ? line.inventory_transfer?.destination_warehouse?.name ?? null
          : line.inventory_transfer?.source_warehouse?.name ?? null,
        created_at: line.created_at,
      };
    });
  }

  /**
   * Map InventoryBatch entity to BatchDetailResponseDto
   */
  private mapToDetailResponseDto(
    batch: InventoryBatch,
    transferHistory: Array<{
      transfer_id: string;
      transfer_folio: string;
      direction: 'out' | 'in';
      quantity: string;
      related_batch_id: string | null;
      related_batch_number: string | null;
      warehouse_name: string | null;
      created_at: Date;
    }> = [],
  ): BatchDetailResponseDto {
    const initial = parseFloat(batch.initial_quantity?.toString() ?? '0');
    const available = parseFloat(batch.available_quantity?.toString() ?? '0');
    const consumed = parseFloat((initial - available).toFixed(3));
    const availabilityPct = initial > 0 ? Math.round((available / initial) * 100) : 100;
    const transfersOut = transferHistory.filter((t) => t.direction === 'out');
    const transfersIn = transferHistory.filter((t) => t.direction === 'in');
    const totalOut = transfersOut.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    const totalIn = transfersIn.reduce((sum, t) => sum + parseFloat(t.quantity), 0);

    return {
      id: batch.id,
      batch_number: batch.batch_number,
      source_tag_identifier: batch.source_tag_identifier ?? null,
      product_id: batch.product_id,
      product_name: batch.product?.name ?? null,
      product_sku: batch.product?.sku ?? null,
      warehouse_id: batch.warehouse_id,
      warehouse_name: batch.warehouse?.name ?? null,
      ...this.mapLocationFields(batch.warehouse),
      purchase_order_id: batch.purchase_order_batch_id ?? null,
      purchase_order_batch_id: batch.purchase_order_batch_id ?? null,
      purchase_order_detail_id: batch.purchase_order_detail_id ?? null,
      purchase_order_folio: batch.purchase_order_batch?.folio ?? null,
      pedimento_number: batch.purchase_order_batch?.pedimento_number ?? null,
      uom_id: batch.uom_id,
      uom_name: batch.uom?.name ?? null,
      initial_quantity: initial.toFixed(3),
      available_quantity: available.toFixed(3),
      quantity_consumed: consumed.toFixed(3),
      availability_percentage: availabilityPct,
      created_by: batch.created_by,
      created_at: batch.created_at,
      transferred_from_batch_id: batch.transferred_from_batch_id ?? null,
      transferred_from_batch_number: batch.transferred_from_batch?.batch_number ?? null,
      transfer_history: transferHistory,
      movement_summary: {
        total_movements: transferHistory.length,
        total_out: parseFloat(totalOut.toFixed(3)),
        total_in: parseFloat(totalIn.toFixed(3)),
        by_type: {
          orders: 0,
          transfers_out: transfersOut.length,
          transfers_in: transfersIn.length,
          adjustments: 0,
        },
      },
    };
  }
}
