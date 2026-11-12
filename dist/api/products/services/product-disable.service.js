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
exports.ProductDisableService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../../../entities/products/product.entity");
const inventory_batch_entity_1 = require("../../../entities/purchase-orders/inventory-batch.entity");
const inventory_transfer_entity_1 = require("../../../entities/inventory/inventory-transfer.entity");
const inventory_transfer_status_enum_1 = require("../../../entities/inventory/inventory-transfer-status.enum");
const inventory_stock_ledger_movement_type_enum_1 = require("../../../entities/inventory/inventory-stock-ledger-movement-type.enum");
const inventory_stock_ledger_service_1 = require("../../inventory/services/inventory-stock-ledger.service");
const inventory_stock_ledger_valuation_service_1 = require("../../inventory/services/inventory-stock-ledger-valuation.service");
const product_disable_util_1 = require("../utils/product-disable.util");
const WRITE_OFF_NOTE = 'Baja de inventario al deshabilitar el producto';
let ProductDisableService = class ProductDisableService {
    productRepo;
    dataSource;
    stockLedger;
    stockLedgerValuation;
    constructor(productRepo, dataSource, stockLedger, stockLedgerValuation) {
        this.productRepo = productRepo;
        this.dataSource = dataSource;
        this.stockLedger = stockLedger;
        this.stockLedgerValuation = stockLedgerValuation;
    }
    async getImpact(id, tenantId) {
        const product = await this.requireProduct(id, tenantId);
        const batches = await this.dataSource
            .createQueryBuilder(inventory_batch_entity_1.InventoryBatch, 'batch')
            .leftJoinAndSelect('batch.uom', 'uom')
            .where('batch.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.product_id = :productId', { productId: product.id })
            .andWhere('batch.available_quantity > 0')
            .getMany();
        const summary = (0, product_disable_util_1.summarizeStock)(batches.map((batch) => ({
            quantity: (0, product_disable_util_1.parseQty)(batch.available_quantity),
            uomName: batch.uom?.name ?? '',
        })));
        const openTransferCount = await this.countOpenTransfers(this.dataSource.manager, tenantId, product.id);
        return {
            is_active: product.is_active,
            has_inventory: summary.lotCount > 0,
            lot_count: summary.lotCount,
            open_transfer_count: openTransferCount,
            by_uom: summary.byUom,
        };
    }
    async apply(id, dto, tenantId, userId) {
        const product = await this.requireProduct(id, tenantId);
        if (dto.is_active) {
            if (product.is_active)
                return product;
            product.is_active = true;
            return this.productRepo.save(product);
        }
        if (!product.is_active)
            return product;
        return this.disable(product, dto.write_off_inventory === true, tenantId, userId ?? null);
    }
    async disable(product, writeOffConfirmed, tenantId, userId) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const locked = await qr.manager
                .createQueryBuilder(product_entity_1.Product, 'product')
                .where('product.id = :id AND product.tenant_id = :tenantId', {
                id: product.id,
                tenantId,
            })
                .setLock('pessimistic_write')
                .getOne();
            if (!locked) {
                throw new common_1.NotFoundException(`Producto con ID ${product.id} no encontrado`);
            }
            if (!locked.is_active) {
                await qr.commitTransaction();
                return locked;
            }
            const openTransferCount = await this.countOpenTransfers(qr.manager, tenantId, locked.id);
            if (openTransferCount > 0) {
                throw new common_1.BadRequestException('Hay transferencias abiertas de este producto. Recíbelas o cancélalas antes de deshabilitarlo.');
            }
            const batches = await qr.manager
                .createQueryBuilder(inventory_batch_entity_1.InventoryBatch, 'batch')
                .where('batch.tenant_id = :tenantId', { tenantId })
                .andWhere('batch.product_id = :productId', { productId: locked.id })
                .andWhere('batch.available_quantity > 0')
                .orderBy('batch.warehouse_id', 'ASC')
                .addOrderBy('batch.uom_id', 'ASC')
                .addOrderBy('batch.id', 'ASC')
                .setLock('pessimistic_write')
                .getMany();
            if (batches.length > 0 && !writeOffConfirmed) {
                throw new common_1.BadRequestException('Este producto tiene inventario. Confirma la baja para deshabilitarlo.');
            }
            const occurredAt = new Date();
            for (const batch of batches) {
                const before = (0, product_disable_util_1.parseQty)(batch.available_quantity);
                if (before <= 0)
                    continue;
                batch.available_quantity = 0;
                await qr.manager.save(inventory_batch_entity_1.InventoryBatch, batch);
                const valuation = await this.stockLedgerValuation.resolveFromBatchId(tenantId, batch.id, qr.manager);
                await this.stockLedger.append({
                    tenantId,
                    productId: locked.id,
                    warehouseId: batch.warehouse_id,
                    uomId: batch.uom_id,
                    inventoryBatchId: batch.id,
                    movementType: inventory_stock_ledger_movement_type_enum_1.InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT,
                    quantityDelta: -before,
                    unitCostMxn: valuation.unitCostMxn,
                    unitSalePriceMxn: valuation.unitSalePriceMxn,
                    occurredAt,
                    referenceType: inventory_stock_ledger_service_1.STOCK_LEDGER_REFERENCE.PRODUCT,
                    referenceId: locked.id,
                    referenceFolio: locked.sku.slice(0, 50),
                    createdBy: userId,
                    notes: WRITE_OFF_NOTE,
                }, qr.manager);
            }
            locked.is_active = false;
            const saved = await qr.manager.save(product_entity_1.Product, locked);
            await qr.commitTransaction();
            return saved;
        }
        catch (error) {
            await qr.rollbackTransaction();
            throw error;
        }
        finally {
            await qr.release();
        }
    }
    async countOpenTransfers(manager, tenantId, productId) {
        const rows = await manager
            .createQueryBuilder(inventory_transfer_entity_1.InventoryTransfer, 'transfer')
            .innerJoin('transfer.lines', 'line')
            .innerJoin('line.source_inventory_batch', 'batch')
            .where('transfer.tenant_id = :tenantId', { tenantId })
            .andWhere('batch.product_id = :productId', { productId })
            .andWhere('transfer.status IN (:...statuses)', {
            statuses: [...inventory_transfer_status_enum_1.OPEN_TRANSFER_STATUSES],
        })
            .select('transfer.id', 'id')
            .distinct(true)
            .getRawMany();
        return rows.length;
    }
    async requireProduct(id, tenantId) {
        const product = await this.productRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Producto con ID ${id} no encontrado`);
        }
        return product;
    }
};
exports.ProductDisableService = ProductDisableService;
exports.ProductDisableService = ProductDisableService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource,
        inventory_stock_ledger_service_1.InventoryStockLedgerService,
        inventory_stock_ledger_valuation_service_1.InventoryStockLedgerValuationService])
], ProductDisableService);
//# sourceMappingURL=product-disable.service.js.map