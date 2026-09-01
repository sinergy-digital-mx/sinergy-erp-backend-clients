import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryAuditService } from './inventory-audit.service';
import { InventoryAuditFolioService } from './inventory-audit-folio.service';
import { InventoryAudit } from '../../../entities/inventory/inventory-audit.entity';
import { InventoryAuditLine } from '../../../entities/inventory/inventory-audit-line.entity';
import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';

describe('InventoryAuditService', () => {
  let service: InventoryAuditService;
  let auditRepo: any;
  let lineRepo: any;
  let batchRepo: any;
  let warehouseRepo: any;
  let folioService: { generateFolio: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };

  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const warehouseId = 'wh-1';
  const batchId = 'batch-1';
  const auditId = 'audit-1';

  const warehouse = {
    id: warehouseId,
    tenant_id: tenantId,
    name: 'Bodega',
    code: 'BDG',
    status: 'active',
    billing_branch_id: 'br-1',
    billing_branch: {
      id: 'br-1',
      code: 'SBA',
      city: 'Caborca',
      state: 'Sonora',
      fiscal_configuration: { id: 'fc-1', razon_social: 'MZN', rfc: 'MZN010101XXX' },
    },
  };

  const batch = {
    id: batchId,
    tenant_id: tenantId,
    warehouse_id: warehouseId,
    product_id: 'prod-1',
    uom_id: 'uom-1',
    batch_number: 'MZN-SBA-BDG-00001',
    source_tag_identifier: 'TAG-1',
    measure: 12,
    measure_uom_id: 'uom-foot',
    available_quantity: 10,
    initial_quantity: 20,
    created_at: new Date('2026-01-01'),
    product: { name: 'Pino', sku: 'PINO-01' },
    uom: { name: 'Pie' },
    measure_uom: { id: 'uom-foot', name: 'Foot' },
    purchase_order_batch: { folio: 'OC-1' },
  };

  const qbChain = (overrides: Record<string, unknown> = {}) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawMany: jest.fn().mockResolvedValue([]),
    ...overrides,
  });

  beforeEach(async () => {
    auditRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qbChain()),
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
    };
    lineRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qbChain()),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (entity) => entity),
    };
    batchRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qbChain({ getMany: jest.fn().mockResolvedValue([batch]) })),
      findOne: jest.fn(),
    };
    warehouseRepo = {
      findOne: jest.fn().mockResolvedValue(warehouse),
    };
    folioService = { generateFolio: jest.fn().mockResolvedValue('AUD-000001') };
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          getRepository: jest.fn().mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(qbChain()),
          }),
          create: jest.fn((_cls, data) => data),
          save: jest.fn(async (_cls, data) => data),
          find: jest.fn(),
          findOne: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue(qbChain()),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryAuditService,
        { provide: getRepositoryToken(InventoryAudit), useValue: auditRepo },
        { provide: getRepositoryToken(InventoryAuditLine), useValue: lineRepo },
        { provide: getRepositoryToken(InventoryBatch), useValue: batchRepo },
        { provide: getRepositoryToken(Warehouse), useValue: warehouseRepo },
        { provide: InventoryAuditFolioService, useValue: folioService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(InventoryAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getContext', () => {
    it('returns warehouse lots and open audit if any', async () => {
      auditRepo.createQueryBuilder.mockReturnValue(
        qbChain({ getOne: jest.fn().mockResolvedValue({ id: auditId, folio: 'AUD-000003' }) }),
      );

      const result = await service.getContext(tenantId, warehouseId);

      expect(result.warehouse.name).toBe('Bodega');
      expect(result.total_batches).toBe(1);
      expect(result.total_available_quantity).toBe('10.000');
      expect(result.open_audit_folio).toBe('AUD-000003');
      expect(result.batches[0].batch_number).toBe('MZN-SBA-BDG-00001');
    });

    it('throws if warehouse does not exist', async () => {
      warehouseRepo.findOne.mockResolvedValue(null);
      await expect(service.getContext(tenantId, warehouseId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects inactive warehouse', async () => {
      warehouseRepo.findOne.mockResolvedValue({ ...warehouse, status: 'inactive' });
      await expect(
        service.create({ warehouse_id: warehouseId }, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects if an open audit already exists', async () => {
      auditRepo.createQueryBuilder.mockReturnValue(
        qbChain({ getOne: jest.fn().mockResolvedValue({ id: auditId, folio: 'AUD-000002' }) }),
      );
      await expect(
        service.create({ warehouse_id: warehouseId }, tenantId, userId),
      ).rejects.toThrow(/Ya existe una auditoría abierta \(AUD-000002\)/);
    });

    it('rejects warehouse without lots', async () => {
      batchRepo.createQueryBuilder.mockReturnValue(
        qbChain({ getMany: jest.fn().mockResolvedValue([]) }),
      );
      await expect(
        service.create({ warehouse_id: warehouseId }, tenantId, userId),
      ).rejects.toThrow('No hay lotes con existencia en el almacén seleccionado');
    });
  });

  describe('updateLines', () => {
    const draftAudit = {
      id: auditId,
      tenant_id: tenantId,
      status: InventoryAuditStatus.DRAFT,
    };

    it('saves counted quantity and variance', async () => {
      auditRepo.findOne.mockResolvedValue(draftAudit);
      lineRepo.find.mockResolvedValue([
        { id: 'line-1', inventory_audit_id: auditId, system_quantity: 10, counted_quantity: null },
      ]);
      jest.spyOn(service, 'findById').mockResolvedValue({ id: auditId } as any);

      await service.updateLines(
        auditId,
        { lines: [{ id: 'line-1', counted_quantity: 8, reason: 'Merma' }] },
        tenantId,
        userId,
      );

      expect(lineRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          counted_quantity: 8,
          variance: -2,
          reason: 'Merma',
          counted_by: userId,
        }),
      );
    });

    it('rejects capture when not in draft', async () => {
      auditRepo.findOne.mockResolvedValue({
        ...draftAudit,
        status: InventoryAuditStatus.SUBMITTED,
      });
      await expect(
        service.updateLines(
          auditId,
          { lines: [{ id: 'line-1', counted_quantity: 8 }] },
          tenantId,
          userId,
        ),
      ).rejects.toThrow(/No se puede capturar conteo/);
    });
  });

  describe('submit', () => {
    it('requires all lines counted', async () => {
      auditRepo.createQueryBuilder.mockReturnValue(
        qbChain({
          getOne: jest.fn().mockResolvedValue({
            id: auditId,
            tenant_id: tenantId,
            status: InventoryAuditStatus.DRAFT,
            lines: [
              { counted_quantity: 8, variance: -2, reason: 'Merma' },
              { counted_quantity: null, variance: null, reason: null },
            ],
          }),
        }),
      );

      await expect(service.submit(auditId, tenantId, userId)).rejects.toThrow(
        'Faltan 1 lote(s) por contar antes de enviar a autorización',
      );
    });

    it('requires reason when there is variance', async () => {
      auditRepo.createQueryBuilder.mockReturnValue(
        qbChain({
          getOne: jest.fn().mockResolvedValue({
            id: auditId,
            tenant_id: tenantId,
            status: InventoryAuditStatus.DRAFT,
            lines: [{ counted_quantity: 8, variance: -2, reason: null }],
          }),
        }),
      );

      await expect(service.submit(auditId, tenantId, userId)).rejects.toThrow(
        '1 lote(s) con diferencia requieren motivo de corrección',
      );
    });
  });

  describe('authorize', () => {
    it('sets available_quantity to counted quantity', async () => {
      const line = {
        id: 'line-1',
        inventory_audit_id: auditId,
        inventory_batch_id: batchId,
        counted_quantity: 7,
        system_quantity: 10,
      };
      const lockedBatch = { ...batch, available_quantity: 9 };
      const lockedAudit = {
        id: auditId,
        folio: 'AUD-000001',
        status: InventoryAuditStatus.SUBMITTED,
        notes: 'Conteo semanal',
      };
      const qr = dataSource.createQueryRunner();
      qr.manager.createQueryBuilder
        .mockReturnValueOnce(qbChain({ getOne: jest.fn().mockResolvedValue(lockedAudit) }))
        .mockReturnValueOnce(qbChain({ getOne: jest.fn().mockResolvedValue(lockedBatch) }));
      qr.manager.find.mockResolvedValue([line]);
      auditRepo.findOne.mockResolvedValue({
        id: auditId,
        tenant_id: tenantId,
        status: InventoryAuditStatus.SUBMITTED,
      });
      jest.spyOn(service, 'findById').mockResolvedValue({ id: auditId, status: 'posted' } as any);

      await service.authorize(auditId, { notes: 'OK' }, tenantId, userId);

      expect(qr.manager.save).toHaveBeenCalledWith(
        InventoryBatch,
        expect.objectContaining({ available_quantity: 7 }),
      );
      expect(qr.manager.save).toHaveBeenCalledWith(
        InventoryAuditLine,
        expect.objectContaining({
          quantity_before_post: 9,
          quantity_after_post: 7,
        }),
      );
      expect(qr.commitTransaction).toHaveBeenCalled();
    });

    it('rejects authorize unless submitted', async () => {
      auditRepo.findOne.mockResolvedValue({
        id: auditId,
        tenant_id: tenantId,
        status: InventoryAuditStatus.DRAFT,
      });
      await expect(service.authorize(auditId, {}, tenantId, userId)).rejects.toThrow(
        /No se puede autorizar/,
      );
    });
  });

  describe('reject and cancel', () => {
    it('returns submitted audit to draft', async () => {
      auditRepo.findOne.mockResolvedValue({
        id: auditId,
        tenant_id: tenantId,
        status: InventoryAuditStatus.SUBMITTED,
      });
      jest.spyOn(service, 'findById').mockResolvedValue({ id: auditId } as any);

      await service.reject(auditId, { reason: 'Recontar pino' }, tenantId, userId);

      expect(auditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InventoryAuditStatus.DRAFT,
          rejected_by: userId,
          rejection_reason: 'Recontar pino',
          submitted_by: null,
        }),
      );
    });

    it('cancels draft without posting', async () => {
      auditRepo.findOne.mockResolvedValue({
        id: auditId,
        tenant_id: tenantId,
        status: InventoryAuditStatus.DRAFT,
      });
      jest.spyOn(service, 'findById').mockResolvedValue({ id: auditId } as any);

      await service.cancel(auditId, { reason: 'Se pausó el conteo' }, tenantId, userId);

      expect(auditRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InventoryAuditStatus.CANCELLED,
          cancellation_reason: 'Se pausó el conteo',
        }),
      );
    });

    it('cannot cancel a posted audit', async () => {
      auditRepo.findOne.mockResolvedValue({
        id: auditId,
        tenant_id: tenantId,
        status: InventoryAuditStatus.POSTED,
      });
      await expect(
        service.cancel(auditId, { reason: 'tarde' }, tenantId, userId),
      ).rejects.toThrow(/No se puede cancelar/);
    });
  });
});
