import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { SalesOrderDetail } from '../../../entities/sales-orders/sales-order-detail.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { InventoryStockLedgerService } from '../../inventory/services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from '../../inventory/services/inventory-stock-ledger-valuation.service';
import { SalesOrderFulfillmentService } from './sales-order-fulfillment.service';

describe('SalesOrderFulfillmentService.releaseAllocations', () => {
  it('borra asignaciones con delete, no remove', async () => {
    const manager = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === InventoryBatch) {
          return {
            id: 'batch-1',
            tenant_id: 't1',
            product_id: 'p1',
            warehouse_id: 'w1',
            uom_id: 'u1',
            available_quantity: 5,
          };
        }
        if (entity === SalesOrderDetail) {
          return {
            id: 'detail-1',
            unit_price: 10,
            discount_unit: 0,
            sales_order_id: 'so-1',
            sales_order: { id: 'so-1', folio: 'OSV-1' },
          };
        }
        return null;
      }),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrderFulfillmentService,
        { provide: getRepositoryToken(InventoryBatch), useValue: {} },
        {
          provide: InventoryStockLedgerService,
          useValue: { append: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: InventoryStockLedgerValuationService,
          useValue: {
            resolveFromBatchId: jest.fn().mockResolvedValue({
              unitCostMxn: 1,
              unitSalePriceMxn: 10,
            }),
          },
        },
      ],
    }).compile();

    const service = module.get(SalesOrderFulfillmentService);
    await service.releaseAllocations(
      [
        {
          id: 'alloc-1',
          inventory_batch_id: 'batch-1',
          sales_order_detail_id: 'detail-1',
          quantity_allocated: 2,
          created_by: 'user-1',
        } as SalesOrderBatchAllocation,
      ],
      manager as any,
    );

    expect(manager.remove).not.toHaveBeenCalled();
    expect(manager.delete).toHaveBeenCalledWith(SalesOrderBatchAllocation, ['alloc-1']);
  });
});
