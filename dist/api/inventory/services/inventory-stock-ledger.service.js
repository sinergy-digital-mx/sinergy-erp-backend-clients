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
exports.InventoryStockLedgerService = exports.STOCK_LEDGER_REFERENCE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_stock_ledger_entity_1 = require("../../../entities/inventory/inventory-stock-ledger.entity");
const stock_ledger_valuation_util_1 = require("../utils/stock-ledger-valuation.util");
exports.STOCK_LEDGER_REFERENCE = {
    PURCHASE_ORDER: 'purchase_order',
    SALES_ORDER: 'sales_order',
    INVENTORY_TRANSFER: 'inventory_transfer',
    INVENTORY_AUDIT: 'inventory_audit',
    INVENTORY_BATCH: 'inventory_batch',
};
function roundQty(value) {
    return parseFloat(value.toFixed(3));
}
let InventoryStockLedgerService = class InventoryStockLedgerService {
    ledgerRepo;
    constructor(ledgerRepo) {
        this.ledgerRepo = ledgerRepo;
    }
    async append(params, manager) {
        const delta = roundQty(params.quantityDelta);
        if (delta === 0) {
            return null;
        }
        const repo = manager
            ? manager.getRepository(inventory_stock_ledger_entity_1.InventoryStockLedger)
            : this.ledgerRepo;
        const previous = await this.getLastRow({
            tenantId: params.tenantId,
            productId: params.productId,
            warehouseId: params.warehouseId,
            uomId: params.uomId,
        }, manager);
        const previousBalance = previous
            ? roundQty(parseFloat(String(previous.balance_after ?? 0)))
            : 0;
        const previousCostBalance = previous?.cost_balance_after_mxn != null
            ? (0, stock_ledger_valuation_util_1.roundStockMoney)(parseFloat(String(previous.cost_balance_after_mxn)))
            : 0;
        const balanceAfter = roundQty(previousBalance + delta);
        const occurredAt = params.occurredAt ?? new Date();
        let unitCost = params.unitCostMxn != null && Number.isFinite(params.unitCostMxn)
            ? (0, stock_ledger_valuation_util_1.roundStockMoney)(params.unitCostMxn)
            : null;
        if (unitCost == null && delta < 0 && previousBalance > 0 && previousCostBalance !== 0) {
            unitCost = (0, stock_ledger_valuation_util_1.roundStockMoney)(previousCostBalance / previousBalance);
        }
        let costBalanceAfter = null;
        if (unitCost != null) {
            costBalanceAfter = (0, stock_ledger_valuation_util_1.roundStockMoney)(previousCostBalance + delta * unitCost);
            if (balanceAfter === 0) {
                costBalanceAfter = 0;
            }
        }
        else if (previous?.cost_balance_after_mxn != null) {
            costBalanceAfter = previousCostBalance;
        }
        const unitSale = params.unitSalePriceMxn != null && Number.isFinite(params.unitSalePriceMxn)
            ? (0, stock_ledger_valuation_util_1.roundStockMoney)(params.unitSalePriceMxn)
            : null;
        const row = repo.create({
            tenant_id: params.tenantId,
            product_id: params.productId,
            warehouse_id: params.warehouseId,
            uom_id: params.uomId,
            inventory_batch_id: params.inventoryBatchId ?? null,
            movement_type: params.movementType,
            quantity_delta: delta,
            balance_after: balanceAfter,
            unit_cost_mxn: unitCost,
            unit_sale_price_mxn: unitSale,
            cost_balance_after_mxn: costBalanceAfter,
            occurred_at: occurredAt,
            reference_type: params.referenceType ?? null,
            reference_id: params.referenceId ?? null,
            reference_folio: params.referenceFolio ?? null,
            created_by: params.createdBy ?? null,
            notes: params.notes ?? null,
        });
        return repo.save(row);
    }
    async getLastBalance(key, manager) {
        const last = await this.getLastRow(key, manager);
        if (!last) {
            return 0;
        }
        return roundQty(parseFloat(String(last.balance_after ?? 0)));
    }
    async countForTenant(tenantId, manager) {
        const repo = manager
            ? manager.getRepository(inventory_stock_ledger_entity_1.InventoryStockLedger)
            : this.ledgerRepo;
        return repo.count({ where: { tenant_id: tenantId } });
    }
    async getLastRow(key, manager) {
        const repo = manager
            ? manager.getRepository(inventory_stock_ledger_entity_1.InventoryStockLedger)
            : this.ledgerRepo;
        const qb = repo
            .createQueryBuilder('ledger')
            .where('ledger.tenant_id = :tenantId', { tenantId: key.tenantId })
            .andWhere('ledger.product_id = :productId', { productId: key.productId })
            .andWhere('ledger.warehouse_id = :warehouseId', {
            warehouseId: key.warehouseId,
        })
            .andWhere('ledger.uom_id = :uomId', { uomId: key.uomId })
            .orderBy('ledger.occurred_at', 'DESC')
            .addOrderBy('ledger.created_at', 'DESC')
            .addOrderBy('ledger.id', 'DESC');
        if (manager) {
            qb.setLock('pessimistic_write');
        }
        return qb.getOne();
    }
};
exports.InventoryStockLedgerService = InventoryStockLedgerService;
exports.InventoryStockLedgerService = InventoryStockLedgerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_stock_ledger_entity_1.InventoryStockLedger)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], InventoryStockLedgerService);
//# sourceMappingURL=inventory-stock-ledger.service.js.map