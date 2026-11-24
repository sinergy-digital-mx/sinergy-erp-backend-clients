"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryBranchReportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const inventory_branch_report_setting_entity_1 = require("../../../entities/inventory/inventory-branch-report-setting.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const product_entity_1 = require("../../../entities/products/product.entity");
const product_item_kind_enum_1 = require("../../../entities/products/product-item-kind.enum");
const product_vendor_cost_entity_1 = require("../../../entities/products/product-vendor-cost.entity");
const branch_stock_report_util_1 = require("../utils/branch-stock-report.util");
const inventory_margin_util_1 = require("../utils/inventory-margin.util");
const product_search_rank_util_1 = require("../utils/product-search-rank.util");
const PRODUCT_SEARCH_LIMIT = 10;
let InventoryBranchReportService = class InventoryBranchReportService {
    settingsRepo;
    branchRepo;
    productRepo;
    batchRepo;
    vendorCostRepo;
    constructor(settingsRepo, branchRepo, productRepo, batchRepo, vendorCostRepo) {
        this.settingsRepo = settingsRepo;
        this.branchRepo = branchRepo;
        this.productRepo = productRepo;
        this.batchRepo = batchRepo;
        this.vendorCostRepo = vendorCostRepo;
    }
    async searchProducts(tenantId, search) {
        const term = (search ?? '').trim().slice(0, 80);
        if ((0, product_search_rank_util_1.parseProductSearchTokens)(term).length === 0) {
            return { products: [] };
        }
        const qb = this.productRepo
            .createQueryBuilder('product')
            .select('product.id', 'id')
            .addSelect('product.sku', 'sku')
            .addSelect('product.name', 'name')
            .where('product.tenant_id = :tenantId', { tenantId })
            .andWhere('product.item_kind = :goodsKind', { goodsKind: product_item_kind_enum_1.ProductItemKind.Goods })
            .andWhere('product.is_active = :productActive', { productActive: true });
        (0, product_search_rank_util_1.applyProductSearchFilter)(qb, term);
        const ranked = (0, product_search_rank_util_1.applyProductSearchOrder)(qb, term, false);
        if (!ranked) {
            qb.orderBy('product.name', 'ASC');
        }
        const rows = await qb.limit(PRODUCT_SEARCH_LIMIT).getRawMany();
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
    async getSettings(tenantId) {
        const [branches, saved] = await Promise.all([
            this.loadActiveBranches(tenantId),
            this.settingsRepo.findOne({ where: { tenant_id: tenantId } }),
        ]);
        const visible = new Set((0, branch_stock_report_util_1.selectVisibleBranchIds)(branches.map((branch) => branch.id), saved?.visible_branch_ids ?? null));
        return {
            configured: !!saved,
            branches: branches.map((branch) => ({
                ...branch,
                visible: visible.has(branch.id),
            })),
        };
    }
    async updateSettings(tenantId, userId, branchIds) {
        const branches = await this.loadActiveBranches(tenantId);
        const known = new Set(branches.map((branch) => branch.id));
        const unique = [...new Set(branchIds.map((id) => id.trim()).filter(Boolean))];
        if (unique.length === 0 || unique.some((id) => !known.has(id))) {
            throw new common_1.BadRequestException('Elige sucursales activas. Al menos una.');
        }
        const existing = await this.settingsRepo.findOne({ where: { tenant_id: tenantId } });
        if (existing) {
            existing.visible_branch_ids = unique;
            existing.updated_by = userId;
            await this.settingsRepo.save(existing);
        }
        else {
            await this.settingsRepo.save(this.settingsRepo.create({
                tenant_id: tenantId,
                visible_branch_ids: unique,
                updated_by: userId,
            }));
        }
        return this.getSettings(tenantId);
    }
    async getReport(tenantId, productId) {
        const product = await this.productRepo.findOne({
            where: {
                id: productId,
                tenant_id: tenantId,
                item_kind: product_item_kind_enum_1.ProductItemKind.Goods,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Producto no encontrado');
        }
        const [branches, saved, rawLots, configLines] = await Promise.all([
            this.loadActiveBranches(tenantId),
            this.settingsRepo.findOne({ where: { tenant_id: tenantId } }),
            this.loadLots(tenantId, productId),
            this.loadConfigLines(productId),
        ]);
        const visibleIds = (0, branch_stock_report_util_1.selectVisibleBranchIds)(branches.map((branch) => branch.id), saved?.visible_branch_ids ?? null);
        const visible = new Set(visibleIds);
        const selected = branches.filter((branch) => visible.has(branch.id));
        const lots = rawLots
            .filter((row) => row.billing_branch_id && visible.has(row.billing_branch_id))
            .map((row) => this.toLot(row, configLines));
        const report = (0, branch_stock_report_util_1.buildBranchStockReport)(selected, lots);
        return {
            product: {
                id: product.id,
                sku: product.sku ?? '',
                name: product.name ?? '',
            },
            ...report,
        };
    }
    async loadActiveBranches(tenantId) {
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
            if (byName !== 0)
                return byName;
            return (left.razon_social ?? '').localeCompare(right.razon_social ?? '', 'es', {
                sensitivity: 'base',
            });
        });
    }
    async loadLots(tenantId, productId) {
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
            .getRawMany();
    }
    async loadConfigLines(productId) {
        const costs = await this.vendorCostRepo
            .createQueryBuilder('pvc')
            .leftJoinAndSelect('pvc.product_uom', 'product_uom')
            .leftJoinAndSelect('product_uom.uom', 'uom')
            .leftJoinAndSelect('pvc.vendor', 'vendor')
            .where('pvc.product_id = :productId', { productId })
            .getMany();
        const byUom = new Map();
        for (const row of costs) {
            const catalogId = row.product_uom?.uom_catalog_id;
            if (!catalogId)
                continue;
            const line = {
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
    toLot(row, configLines) {
        const lines = row.uom_id ? (configLines.get(row.uom_id) ?? []) : [];
        const { margin } = (0, inventory_margin_util_1.resolveLotMargin)(this.purchaseInput(row), lines, {
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
    purchaseInput(row) {
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
    optionalMoney(value) {
        if (value == null || value === '')
            return null;
        const parsed = this.parseDecimal(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    parseDecimal(value) {
        const parsed = parseFloat(String(value ?? 0));
        return Number.isFinite(parsed) ? parsed : 0;
    }
};
exports.InventoryBranchReportService = InventoryBranchReportService;
exports.InventoryBranchReportService = InventoryBranchReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_branch_report_setting_entity_1.InventoryBranchReportSetting)),
    __param(1, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __param(4, (0, typeorm_1.InjectRepository)(product_vendor_cost_entity_1.ProductVendorCost)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryBranchReportService);
//# sourceMappingURL=inventory-branch-report.service.js.map