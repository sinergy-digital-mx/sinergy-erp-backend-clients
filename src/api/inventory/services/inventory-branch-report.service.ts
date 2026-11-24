import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { InventoryBranchReportSetting } from '../../../entities/inventory/inventory-branch-report-setting.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { Product } from '../../../entities/products/product.entity';
import { ProductItemKind } from '../../../entities/products/product-item-kind.enum';
import { ProductVendorCost } from '../../../entities/products/product-vendor-cost.entity';
import {
  BranchReportProductSearchResponseDto,
  BranchReportSettingsResponseDto,
  BranchStockReportResponseDto,
} from '../dto/branch-stock-report.dto';
import {
  BranchReportLotInput,
  buildBranchStockReport,
  selectVisibleBranchIds,
} from '../utils/branch-stock-report.util';
import {
  MarginConfigLineInput,
  MarginPurchaseInput,
  resolveLotMargin,
} from '../utils/inventory-margin.util';
import {
  applyProductSearchFilter,
  applyProductSearchOrder,
  parseProductSearchTokens,
} from '../utils/product-search-rank.util';

const PRODUCT_SEARCH_LIMIT = 10;

interface BranchRow {
  id: string;
  name: string;
  city: string | null;
  razon_social: string | null;
}

interface LotRaw {
  billing_branch_id: string | null;
  uom_id: string | null;
  uom_name: string | null;
  available_quantity: string | number | null;
  purchase_order_batch_id: string | null;
  purchase_order_detail_id: string | null;
  purchase_order_folio: string | null;
  payment_currency: string | null;
  customs_exchange_rate: string | number | null;
  unit_total: string | number | null;
  received_original_unit_total: string | number | null;
  real_unit_cost_mxn: string | number | null;
  received_original_quantity: string | number | null;
  received_converted_quantity: string | number | null;
}

@Injectable()
export class InventoryBranchReportService {
  constructor(
    @InjectRepository(InventoryBranchReportSetting)
    private readonly settingsRepo: Repository<InventoryBranchReportSetting>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(InventoryBatch)
    private readonly batchRepo: Repository<InventoryBatch>,
    @InjectRepository(ProductVendorCost)
    private readonly vendorCostRepo: Repository<ProductVendorCost>,
  ) {}

  async searchProducts(
    tenantId: string,
    search: string,
  ): Promise<BranchReportProductSearchResponseDto> {
    const term = (search ?? '').trim().slice(0, 80);
    if (parseProductSearchTokens(term).length === 0) {
      return { products: [] };
    }

    const qb = this.productRepo
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .addSelect('product.sku', 'sku')
      .addSelect('product.name', 'name')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.item_kind = :goodsKind', { goodsKind: ProductItemKind.Goods })
      .andWhere('product.is_active = :productActive', { productActive: true });

    applyProductSearchFilter(qb, term);
    const ranked = applyProductSearchOrder(qb, term, false);
    if (!ranked) {
      qb.orderBy('product.name', 'ASC');
    }

    const rows = await qb.limit(PRODUCT_SEARCH_LIMIT).getRawMany<{
      id: string;
      sku: string;
      name: string;
    }>();

    return {
      products: rows
        .map((row) => ({
          id: String(row.id ?? ''),
          sku: String(row.sku ?? ''),
          name: String(row.name ?? ''),
        }))
        .filter((row) => row.id),
    };
  }

  async getSettings(tenantId: string): Promise<BranchReportSettingsResponseDto> {
    const [branches, saved] = await Promise.all([
      this.loadActiveBranches(tenantId),
      this.settingsRepo.findOne({ where: { tenant_id: tenantId } }),
    ]);
    const visible = new Set(
      selectVisibleBranchIds(
        branches.map((branch) => branch.id),
        saved?.visible_branch_ids ?? null,
      ),
    );

    return {
      configured: !!saved,
      branches: branches.map((branch) => ({
        ...branch,
        visible: visible.has(branch.id),
      })),
    };
  }

  async updateSettings(
    tenantId: string,
    userId: string | null,
    branchIds: string[],
  ): Promise<BranchReportSettingsResponseDto> {
    const branches = await this.loadActiveBranches(tenantId);
    const known = new Set(branches.map((branch) => branch.id));
    const unique = [...new Set(branchIds.map((id) => id.trim()).filter(Boolean))];
    if (unique.length === 0 || unique.some((id) => !known.has(id))) {
      throw new BadRequestException('Elige sucursales activas. Al menos una.');
    }

    const existing = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
    if (existing) {
      existing.visible_branch_ids = unique;
      existing.updated_by = userId;
      await this.settingsRepo.save(existing);
    } else {
      await this.settingsRepo.save(
        this.settingsRepo.create({
          tenant_id: tenantId,
          visible_branch_ids: unique,
          updated_by: userId,
        }),
      );
    }

    return this.getSettings(tenantId);
  }

  async getReport(tenantId: string, productId: string): Promise<BranchStockReportResponseDto> {
    const product = await this.productRepo.findOne({
      where: {
        id: productId,
        tenant_id: tenantId,
        item_kind: ProductItemKind.Goods,
      },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const [branches, saved, rawLots, configLines] = await Promise.all([
      this.loadActiveBranches(tenantId),
      this.settingsRepo.findOne({ where: { tenant_id: tenantId } }),
      this.loadLots(tenantId, productId),
      this.loadConfigLines(productId),
    ]);

    const visibleIds = selectVisibleBranchIds(
      branches.map((branch) => branch.id),
      saved?.visible_branch_ids ?? null,
    );
    const visible = new Set(visibleIds);
    const selected = branches.filter((branch) => visible.has(branch.id));
    const lots = rawLots
      .filter((row) => row.billing_branch_id && visible.has(row.billing_branch_id))
      .map((row) => this.toLot(row, configLines));

    const report = buildBranchStockReport(selected, lots);
    return {
      product: {
        id: product.id,
        sku: product.sku ?? '',
        name: product.name ?? '',
      },
      ...report,
    };
  }

  private async loadActiveBranches(tenantId: string): Promise<BranchRow[]> {
    const rows = await this.branchRepo
      .createQueryBuilder('branch')
      .innerJoinAndSelect('branch.fiscal_configuration', 'fc')
      .where('fc.tenant_id = :tenantId', { tenantId })
      .andWhere('branch.status = :branchActive', { branchActive: 1 })
      .getMany();

    return rows
      .map((branch) => ({
        id: branch.id,
        name: branch.code?.trim() || 'Sucursal',
        city: branch.city?.trim() || null,
        razon_social: branch.fiscal_configuration?.razon_social?.trim() || null,
      }))
      .sort((left, right) => {
        const byName = left.name.localeCompare(right.name, 'es', { sensitivity: 'base' });
        if (byName !== 0) return byName;
        return (left.razon_social ?? '').localeCompare(right.razon_social ?? '', 'es', {
          sensitivity: 'base',
        });
      });
  }

  private async loadLots(tenantId: string, productId: string): Promise<LotRaw[]> {
    return this.batchRepo
      .createQueryBuilder('batch')
      .innerJoin('batch.warehouse', 'warehouse')
      .leftJoin('batch.uom', 'uom')
      .leftJoin('batch.purchase_order_batch', 'po')
      .leftJoin('batch.purchase_order_detail', 'pod')
      .select('warehouse.billing_branch_id', 'billing_branch_id')
      .addSelect('batch.uom_id', 'uom_id')
      .addSelect('uom.name', 'uom_name')
      .addSelect('batch.available_quantity', 'available_quantity')
      .addSelect('batch.purchase_order_batch_id', 'purchase_order_batch_id')
      .addSelect('batch.purchase_order_detail_id', 'purchase_order_detail_id')
      .addSelect('po.folio', 'purchase_order_folio')
      .addSelect('po.payment_currency', 'payment_currency')
      .addSelect('po.customs_exchange_rate', 'customs_exchange_rate')
      .addSelect('pod.unit_total', 'unit_total')
      .addSelect('pod.received_original_unit_total', 'received_original_unit_total')
      .addSelect('pod.real_unit_cost_mxn', 'real_unit_cost_mxn')
      .addSelect('pod.received_original_quantity', 'received_original_quantity')
      .addSelect('pod.received_converted_quantity', 'received_converted_quantity')
      .where('batch.tenant_id = :tenantId', { tenantId })
      .andWhere('batch.product_id = :productId', { productId })
      .andWhere('batch.available_quantity > 0')
      .andWhere('warehouse.billing_branch_id IS NOT NULL')
      .getRawMany<LotRaw>();
  }

  private async loadConfigLines(productId: string): Promise<Map<string, MarginConfigLineInput[]>> {
    const costs = await this.vendorCostRepo
      .createQueryBuilder('pvc')
      .leftJoinAndSelect('pvc.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .leftJoinAndSelect('pvc.vendor', 'vendor')
      .where('pvc.product_id = :productId', { productId })
      .getMany();

    const byUom = new Map<string, MarginConfigLineInput[]>();
    for (const row of costs) {
      const catalogId = row.product_uom?.uom_catalog_id;
      if (!catalogId) continue;
      const line: MarginConfigLineInput = {
        vendorName: row.vendor?.company_name || row.vendor?.name || 'Proveedor',
        uomName: row.product_uom?.uom?.name ?? '',
        cost: this.parseDecimal(row.cost),
        currency: row.currency || 'MXN',
      };
      const list = byUom.get(catalogId) ?? [];
      list.push(line);
      byUom.set(catalogId, list);
    }
    return byUom;
  }

  private toLot(row: LotRaw, configLines: Map<string, MarginConfigLineInput[]>): BranchReportLotInput {
    const lines = row.uom_id ? (configLines.get(row.uom_id) ?? []) : [];
    const { margin } = resolveLotMargin(this.purchaseInput(row), lines, {
      amount: null,
      listName: null,
    });
    const unitCost = margin.unit_cost == null ? null : Number(margin.unit_cost);

    return {
      billing_branch_id: String(row.billing_branch_id ?? ''),
      quantity: this.parseDecimal(row.available_quantity),
      uom_name: row.uom_name?.trim() || null,
      unit_cost: unitCost != null && Number.isFinite(unitCost) ? unitCost : null,
    };
  }

  private purchaseInput(row: LotRaw): MarginPurchaseInput | null {
    if (!row.purchase_order_batch_id && !row.purchase_order_detail_id) {
      return null;
    }
    const received = this.optionalMoney(row.received_original_unit_total);
    return {
      hasPurchase: true,
      folio: row.purchase_order_folio ?? null,
      currency: row.payment_currency ?? null,
      vendorUnitCost: received ?? this.optionalMoney(row.unit_total),
      realUnitCostMxn: this.optionalMoney(row.real_unit_cost_mxn),
      originalQuantity: this.optionalMoney(row.received_original_quantity),
      convertedQuantity: this.optionalMoney(row.received_converted_quantity),
      customsExchangeRate: this.optionalMoney(row.customs_exchange_rate),
    };
  }

  private optionalMoney(value: unknown): number | null {
    if (value == null || value === '') return null;
    const parsed = this.parseDecimal(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseDecimal(value: unknown): number {
    const parsed = parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
