import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PurchaseOrderMovementsService } from './purchase-order-movements.service';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderDocument } from '../../../entities/purchase-orders/purchase-order-document.entity';
import { PurchaseOrderPayment } from '../../../entities/purchase-orders/purchase-order-payment.entity';
import { InventoryTransferLine } from '../../../entities/inventory/inventory-transfer-line.entity';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { SalesOrderBatchAllocation } from '../../../entities/sales-orders/sales-order-batch-allocation.entity';
import { User } from '../../../entities/users/user.entity';

describe('PurchaseOrderMovementsService', () => {
  let service: PurchaseOrderMovementsService;
  const poRepo = { findOne: jest.fn() };
  const batchRepo = { find: jest.fn() };
  const documentRepo = { find: jest.fn() };
  const paymentRepo = { find: jest.fn() };
  const transferLineRepo = { createQueryBuilder: jest.fn() };
  const auditLineRepo = { createQueryBuilder: jest.fn() };
  const allocationRepo = { createQueryBuilder: jest.fn() };
  const userRepo = { find: jest.fn() };
  const activityService = { listForOrder: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderMovementsService,
        { provide: getRepositoryToken(PurchaseOrderBatch), useValue: poRepo },
        { provide: getRepositoryToken(InventoryBatch), useValue: batchRepo },
        { provide: getRepositoryToken(PurchaseOrderDocument), useValue: documentRepo },
        { provide: getRepositoryToken(PurchaseOrderPayment), useValue: paymentRepo },
        { provide: getRepositoryToken(InventoryTransferLine), useValue: transferLineRepo },
        { provide: getRepositoryToken(InventoryAuditLine), useValue: auditLineRepo },
        { provide: getRepositoryToken(SalesOrderBatchAllocation), useValue: allocationRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PurchaseOrderActivityService, useValue: activityService },
      ],
    }).compile();
    service = module.get(PurchaseOrderMovementsService);
  });

  it('arma created + lot_received + lot_migrated', async () => {
    poRepo.findOne.mockResolvedValue({
      id: 'po-1',
      folio: 'ODC-000020',
      created_at: new Date('2026-01-10T09:00:00Z'),
      created_by: 'u1',
      creator: { first_name: 'Miguel', last_name: 'Arriaga' },
      vendor: { name: 'TURMAN' },
    });
    activityService.listForOrder.mockResolvedValue([
      {
        id: 'act-1',
        type: 'line_updated',
        title: 'Producto actualizado',
        description: 'Se actualizó ENCINO.',
        occurred_at: new Date('2026-01-10T09:30:00Z'),
        actor_id: 'u1',
        actor: { first_name: 'Miguel', last_name: 'Arriaga' },
        changes: [
          { field: 'iva_percentage', field_label: 'IVA %', from: '16', to: '0' },
        ],
        metadata: {},
      },
    ]);
    batchRepo.find.mockResolvedValue([
      {
        id: 'root',
        batch_number: 'MZN-CTIJ-BDG-00005',
        transferred_from_batch_id: null,
        initial_quantity: 1314,
        created_at: new Date('2026-01-10T11:00:00Z'),
        created_by: 'u1',
        product: { name: 'ENCINO 4/4' },
        warehouse: { name: 'Bodega' },
        uom: { name: 'PT' },
      },
      {
        id: 'dest',
        batch_number: 'MZN-CTR-BDG-01493',
        transferred_from_batch_id: 'root',
        initial_quantity: 1314,
        created_at: new Date('2026-01-12T10:00:00Z'),
        created_by: 'u2',
        product: { name: 'ENCINO 4/4' },
        warehouse: { name: 'Bodega Torreón' },
        uom: { name: 'PT' },
      },
    ]);
    documentRepo.find.mockResolvedValue([]);
    paymentRepo.find.mockResolvedValue([]);
    userRepo.find.mockResolvedValue([
      { id: 'u1', first_name: 'Miguel', last_name: 'Arriaga' },
    ]);

    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    transferLineRepo.createQueryBuilder.mockReturnValue(qb);
    auditLineRepo.createQueryBuilder.mockReturnValue(qb);
    allocationRepo.createQueryBuilder.mockReturnValue(qb);
    qb.getMany
      .mockResolvedValueOnce([
        {
          id: 'line-1',
          quantity: 1314,
          created_at: new Date('2026-01-12T10:00:00Z'),
          inventory_transfer_id: 'trf-1',
          inventory_transfer: {
            folio: 'TRF-000010',
            created_by: 'u2',
            created_by_user: { first_name: 'Ana', last_name: '' },
            destination_warehouse: {
              name: 'Bodega Torreón',
              billing_branch: { code: 'Torreón' },
            },
          },
          source_inventory_batch: { batch_number: 'MZN-CTIJ-BDG-00005' },
          destination_inventory_batch: { batch_number: 'MZN-CTR-BDG-01493' },
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await service.list('po-1', 'tenant-1');
    const types = result.data.map((row) => row.type);

    expect(types).toContain('created');
    expect(types).toContain('received');
    expect(types).toContain('lot_received');
    expect(types).toContain('lot_migrated');
    expect(types).toContain('line_updated');
    const iva = result.data.find((row) => row.type === 'line_updated');
    expect(iva?.changes[0]).toEqual({
      field: 'iva_percentage',
      field_label: 'IVA %',
      from: '16',
      to: '0',
    });
    expect(result.data[0].occurred_at.getTime()).toBeGreaterThanOrEqual(
      result.data[result.data.length - 1].occurred_at.getTime(),
    );
  });

  it('404 si la OC no existe', async () => {
    poRepo.findOne.mockResolvedValue(null);
    await expect(service.list('missing', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
