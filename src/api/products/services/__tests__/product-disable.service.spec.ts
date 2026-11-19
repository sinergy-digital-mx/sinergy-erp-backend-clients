import { BadRequestException } from '@nestjs/common';
import { Product } from '../../../../entities/products/product.entity';
import { InventoryBatch } from '../../../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransfer } from '../../../../entities/inventory/inventory-transfer.entity';
import { InventoryStockLedgerMovementType } from '../../../../entities/inventory/inventory-stock-ledger-movement-type.enum';
import { InventoryStockLedgerService, STOCK_LEDGER_REFERENCE } from '../../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../../inventory/services/inventory-stock-ledger-valuation.service';
import { ProductDisableService } from '../product-disable.service';

function queryBuilder(result: {
  getMany?: unknown;
  getOne?: unknown;
  getRawMany?: unknown;
}) {
  const qb: Record<string, jest.Mock> = {};
  const passthrough = () => qb;
  for (const method of [
    'leftJoinAndSelect',
    'innerJoin',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'select',
    'distinct',
    'setLock',
  ]) {
    qb[method] = jest.fn(passthrough);
  }
  qb['getMany'] = jest.fn().mockResolvedValue(result.getMany ?? []);
  qb['getOne'] = jest.fn().mockResolvedValue(result.getOne ?? null);
  qb['getRawMany'] = jest.fn().mockResolvedValue(result.getRawMany ?? []);
  return qb;
}

describe('ProductDisableService', () => {
  let service: ProductDisableService;
  let productRepo: { findOne: jest.Mock; save: jest.Mock };
  let createQueryBuilder: jest.Mock;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { createQueryBuilder: jest.Mock; save: jest.Mock };
  };
  let ledger: { append: jest.Mock };
  let valuation: { resolveFromBatchId: jest.Mock };

  const product = {
    id: 'prod-1',
    tenant_id: 'org-1',
    sku: 'DUP-1',
    name: 'Duplicado',
    is_active: true,
  };

  beforeEach(() => {
    product.is_active = true;
    productRepo = {
      findOne: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn(async (row) => row),
    };
    createQueryBuilder = jest.fn();
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        createQueryBuilder: jest.fn(),
        save: jest.fn(async (_entity, row) => row),
      },
    };
    ledger = { append: jest.fn().mockResolvedValue({ id: 'ledger-1' }) };
    valuation = {
      resolveFromBatchId: jest.fn().mockResolvedValue({
        unitCostMxn: 12,
        unitSalePriceMxn: 20,
      }),
    };

    service = new ProductDisableService(
      productRepo as never,
      {
        createQueryBuilder,
        manager: { createQueryBuilder },
        createQueryRunner: () => queryRunner,
      } as never,
      ledger as never,
      valuation as never,
    );
  });

  it('resume existencias por unidad', async () => {
    createQueryBuilder.mockImplementation((entity: unknown) => {
      if (entity === InventoryBatch) {
        return queryBuilder({
          getMany: [
            { available_quantity: '10', uom: { name: 'Pieza' } },
            { available_quantity: '2.5', uom: { name: 'Pie' } },
          ],
        });
      }
      return queryBuilder({ getRawMany: [] });
    });

    const impact = await service.getImpact('prod-1', 'org-1');

    expect(impact).toEqual({
      is_active: true,
      has_inventory: true,
      lot_count: 2,
      open_transfer_count: 0,
      by_uom: [
        { uom_name: 'Pie', quantity: '2.5' },
        { uom_name: 'Pieza', quantity: '10' },
      ],
    });
  });

  it('no deshabilita con inventario si no se confirma la baja', async () => {
    const locked = { ...product, is_active: true };
    queryRunner.manager.createQueryBuilder.mockImplementation((entity: unknown) => {
      if (entity === Product) return queryBuilder({ getOne: locked });
      if (entity === InventoryTransfer) return queryBuilder({ getRawMany: [] });
      return queryBuilder({
        getMany: [{ id: 'batch-1', available_quantity: '3', warehouse_id: 'wh', uom_id: 'uom' }],
      });
    });

    await expect(
      service.apply('prod-1', { is_active: false }, 'org-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(ledger.append).not.toHaveBeenCalled();
    expect(locked.is_active).toBe(true);
  });

  it('da de baja los lotes y deshabilita cuando se confirma', async () => {
    const locked = { ...product, is_active: true };
    const batch = {
      id: 'batch-1',
      available_quantity: '4.500' as number | string,
      warehouse_id: 'wh-1',
      uom_id: 'uom-1',
    };
    queryRunner.manager.createQueryBuilder.mockImplementation((entity: unknown) => {
      if (entity === Product) return queryBuilder({ getOne: locked });
      if (entity === InventoryTransfer) return queryBuilder({ getRawMany: [] });
      return queryBuilder({ getMany: [batch] });
    });

    const saved = await service.apply(
      'prod-1',
      { is_active: false, write_off_inventory: true },
      'org-1',
      'user-1',
    );

    expect(batch.available_quantity).toBe(0);
    expect(ledger.append).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        uomId: 'uom-1',
        inventoryBatchId: 'batch-1',
        movementType: InventoryStockLedgerMovementType.AUDIT_ADJUSTMENT,
        quantityDelta: -4.5,
        referenceType: STOCK_LEDGER_REFERENCE.PRODUCT,
        referenceId: 'prod-1',
        createdBy: 'user-1',
        notes: 'Baja de inventario al deshabilitar el producto',
      }),
      queryRunner.manager,
    );
    expect(saved.is_active).toBe(false);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('bloquea la baja si hay una transferencia abierta', async () => {
    queryRunner.manager.createQueryBuilder.mockImplementation((entity: unknown) => {
      if (entity === Product) return queryBuilder({ getOne: { ...product, is_active: true } });
      if (entity === InventoryTransfer) return queryBuilder({ getRawMany: [{ id: 'tr-1' }] });
      return queryBuilder({ getMany: [] });
    });

    await expect(
      service.apply('prod-1', { is_active: false, write_off_inventory: true }, 'org-1', 'user-1'),
    ).rejects.toThrow(/transferencias abiertas/);
    expect(ledger.append).not.toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('habilita sin tocar inventario', async () => {
    productRepo.findOne.mockResolvedValue({ ...product, is_active: false });

    const saved = await service.apply('prod-1', { is_active: true }, 'org-1', 'user-1');

    expect(saved.is_active).toBe(true);
    expect(productRepo.save).toHaveBeenCalled();
    expect(queryRunner.connect).not.toHaveBeenCalled();
  });
});
