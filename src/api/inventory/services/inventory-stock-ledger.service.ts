import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryStockLedger } from '../../../entities/inventory/inventory-stock-ledger.entity';
import { InventoryStockLedgerMovementType } from '../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
import { roundStockMoney } from '../utils/stock-ledger-valuation.util';

export const STOCK_LEDGER_REFERENCE = {
  PURCHASE_ORDER: 'purchase_order',
  SALES_ORDER: 'sales_order',
  INVENTORY_TRANSFER: 'inventory_transfer',
  INVENTORY_AUDIT: 'inventory_audit',
  INVENTORY_BATCH: 'inventory_batch',
} as const;

export type AppendStockLedgerParams = {
  tenantId: string;
  productId: string;
  warehouseId: string;
  uomId: string;
  inventoryBatchId?: string | null;
  movementType: InventoryStockLedgerMovementType;
  quantityDelta: number;
  /** Costo unitario MXN al momento (snapshot). */
  unitCostMxn?: number | null;
  /** Precio unitario venta MXN al momento (snapshot). */
  unitSalePriceMxn?: number | null;
  occurredAt?: Date;
  referenceType?: string | null;
  referenceId?: string | null;
  referenceFolio?: string | null;
  createdBy?: string | null;
  notes?: string | null;
};

function roundQty(value: number): number {
  return parseFloat(value.toFixed(3));
}

@Injectable()
export class InventoryStockLedgerService {
  constructor(
    @InjectRepository(InventoryStockLedger)
    private readonly ledgerRepo: Repository<InventoryStockLedger>,
  ) {}

  /**
   * Append-only: calcula balance_after / cost_balance_after_mxn y persiste.
   * Si se pasa `manager`, escribe dentro de esa transacción (con lock).
   * Delta 0 no se escribe.
   */
  async append(
    params: AppendStockLedgerParams,
    manager?: EntityManager,
  ): Promise<InventoryStockLedger | null> {
    const delta = roundQty(params.quantityDelta);
    if (delta === 0) {
      return null;
    }

    const repo = manager
      ? manager.getRepository(InventoryStockLedger)
      : this.ledgerRepo;

    const previous = await this.getLastRow(
      {
        tenantId: params.tenantId,
        productId: params.productId,
        warehouseId: params.warehouseId,
        uomId: params.uomId,
      },
      manager,
    );

    const previousBalance = previous
      ? roundQty(parseFloat(String(previous.balance_after ?? 0)))
      : 0;
    const previousCostBalance = previous?.cost_balance_after_mxn != null
      ? roundStockMoney(parseFloat(String(previous.cost_balance_after_mxn)))
      : 0;

    const balanceAfter = roundQty(previousBalance + delta);
    const occurredAt = params.occurredAt ?? new Date();

    let unitCost =
      params.unitCostMxn != null && Number.isFinite(params.unitCostMxn)
        ? roundStockMoney(params.unitCostMxn)
        : null;

    // Salidas sin costo explícito: usar costo promedio del saldo previo.
    if (unitCost == null && delta < 0 && previousBalance > 0 && previousCostBalance !== 0) {
      unitCost = roundStockMoney(previousCostBalance / previousBalance);
    }

    let costBalanceAfter: number | null = null;
    if (unitCost != null) {
      costBalanceAfter = roundStockMoney(previousCostBalance + delta * unitCost);
      // Evitar basura por redondeo cuando el saldo de piezas llega a 0.
      if (balanceAfter === 0) {
        costBalanceAfter = 0;
      }
    } else if (previous?.cost_balance_after_mxn != null) {
      costBalanceAfter = previousCostBalance;
    }

    const unitSale =
      params.unitSalePriceMxn != null && Number.isFinite(params.unitSalePriceMxn)
        ? roundStockMoney(params.unitSalePriceMxn)
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

  async getLastBalance(
    key: {
      tenantId: string;
      productId: string;
      warehouseId: string;
      uomId: string;
    },
    manager?: EntityManager,
  ): Promise<number> {
    const last = await this.getLastRow(key, manager);
    if (!last) {
      return 0;
    }
    return roundQty(parseFloat(String(last.balance_after ?? 0)));
  }

  async countForTenant(tenantId: string, manager?: EntityManager): Promise<number> {
    const repo = manager
      ? manager.getRepository(InventoryStockLedger)
      : this.ledgerRepo;
    return repo.count({ where: { tenant_id: tenantId } });
  }

  private async getLastRow(
    key: {
      tenantId: string;
      productId: string;
      warehouseId: string;
      uomId: string;
    },
    manager?: EntityManager,
  ): Promise<InventoryStockLedger | null> {
    const repo = manager
      ? manager.getRepository(InventoryStockLedger)
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
}
