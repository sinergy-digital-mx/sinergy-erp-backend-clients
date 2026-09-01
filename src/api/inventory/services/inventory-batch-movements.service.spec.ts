import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InventoryBatchMovementsService } from './inventory-batch-movements.service';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { User } from '../../../entities/users/user.entity';
import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';

describe('InventoryBatchMovementsService', () => {
  let service: InventoryBatchMovementsService;
  let batchRepo: any;
  let transferRepo: any;
  let auditRepo: any;
  let allocationRepo: any;
  let userRepo: any;

  const tenantId = 'tenant-1';
  const batchId = 'batch-1';
  const user = { id: 'user-1', first_name: 'Ana', last_name: 'Pérez' };

  const purchaseBatch = {
    id: batchId,
    tenant_id: tenantId,
    batch_number: 'MZN-CTR-BDG-00001',
    created_by: 'user-1',
    created_at: new Date('2026-08-18T10:00:00Z'),
    initial_quantity: 3,
    available_quantity: 1,
    source_tag_identifier: 'IMPORTACION',
    purchase_order_batch_id: null,
    transferred_from_batch_id: null,
    transferred_from_batch: null,
    purchase_order_batch: null,
    warehouse: { name: 'Bodega' },
    uom: { name: 'Pieza' },
    product: { name: 'Titebond' },
  };

  const qb = (getMany: unknown[] = []) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(getMany),
  });

  beforeEach(async () => {
    batchRepo = { findOne: jest.fn() };
    transferRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb()) };
    auditRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb()) };
    allocationRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb()) };
    userRepo = { find: jest.fn().mockResolvedValue([user]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryBatchMovementsService,
        { provide: getRepositoryToken(InventoryBatch), useValue: batchRepo },
        { provide: getRepositoryToken(InventoryTransferLine), useValue: transferRepo },
        { provide: getRepositoryToken(InventoryAuditLine), useValue: auditRepo },
        { provide: getRepositoryToken(SalesOrderBatchAllocation), useValue: allocationRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(InventoryBatchMovementsService);
  });

  it('throws if batch does not exist', async () => {
    batchRepo.findOne.mockResolvedValue(null);
    await expect(service.list(batchId, tenantId)).rejects.toThrow(NotFoundException);
  });

  it('emits import origin for IMPORTACION without purchase order', async () => {
    batchRepo.findOne.mockResolvedValue(purchaseBatch);
    const result = await service.list(batchId, tenantId);
    expect(result.total).toBe(1);
    expect(result.data[0].type).toBe('imported');
    expect(result.data[0].direction).toBe('in');
    expect(result.data[0].quantity).toBe('3.000');
    expect(result.data[0].actor_name).toBe('Ana Pérez');
    expect(result.data[0].description).toContain('importación');
  });

  it('emits purchase origin when the lot comes from an OC', async () => {
    const data = await service.listForLoadedBatch({
      ...purchaseBatch,
      source_tag_identifier: 'TAG-1',
      purchase_order_batch_id: 'po-1',
      purchase_order_batch: { folio: 'ODC-000020' },
    } as any);
    expect(data[0].type).toBe('purchase_received');
    expect(data[0].description).toContain('ODC-000020');
  });

  it('includes sales, transfer out and authorized audit', async () => {
    transferRepo.createQueryBuilder.mockReturnValue(
      qb([
        {
          id: 'tr-line-1',
          source_inventory_batch_id: batchId,
          destination_inventory_batch_id: 'batch-2',
          quantity: 1,
          created_at: new Date('2026-08-20T10:00:00Z'),
          destination_inventory_batch: { batch_number: 'MZN-SBA-BDG-00002' },
          inventory_transfer: {
            id: 'tr-1',
            folio: 'TRF-000001',
            created_by: 'user-1',
            created_by_user: user,
            destination_warehouse: {
              name: 'Bodega Sur',
              billing_branch: { code: 'SUR' },
            },
          },
        },
      ]),
    );
    allocationRepo.createQueryBuilder.mockReturnValue(
      qb([
        {
          id: 'alloc-1',
          created_by: 'user-1',
          created_at: new Date('2026-08-19T12:00:00Z'),
          quantity_allocated: 2,
          sales_order_detail: {
            sales_order_id: 'so-1',
            sales_order: {
              id: 'so-1',
              folio: 'OV-000010',
              created_by: 'user-1',
              sales_order_type: 'POS',
              creator: user,
              customer: { name: 'Juan', lastname: 'García', company_name: null },
            },
          },
        },
      ]),
    );
    auditRepo.createQueryBuilder.mockReturnValue(
      qb([
        {
          id: 'audit-line-1',
          inventory_audit_id: 'audit-1',
          counted_by: 'user-1',
          counted_by_user: user,
          variance: -0.5,
          quantity_before_post: 1.5,
          quantity_after_post: 1,
          reason: 'Merma',
          updated_at: new Date('2026-08-21T10:00:00Z'),
          inventory_audit: {
            folio: 'AUD-000001',
            status: InventoryAuditStatus.POSTED,
            authorized_by: 'user-2',
            authorized_at: new Date('2026-08-21T11:00:00Z'),
            authorized_by_user: { first_name: 'Luis', last_name: 'Mora' },
          },
        },
      ]),
    );

    const data = await service.listForLoadedBatch(purchaseBatch as any);
    const types = data.map((item) => item.type);
    expect(types).toEqual(['inventory_adjusted', 'transfer_out', 'stock_sold', 'imported']);
    expect(data[0].authorized_by_name).toBe('Luis Mora');
    expect(data[1].type_label).toBe('Salida por transferencia');
    expect(data[2].description).toContain('OV-000010');
    expect(data[2].metadata.customer_name).toBe('Juan García');
  });
});
