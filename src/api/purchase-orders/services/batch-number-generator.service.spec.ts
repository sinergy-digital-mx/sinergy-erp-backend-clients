import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

const WAREHOUSE_ID = '550e8400-e29b-41d4-a716-446655440000';
const TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';

function warehouseWithPrefixes(overrides?: {
  fiscalPrefix?: string | null;
  branchPrefix?: string | null;
  warehousePrefix?: string | null;
  warehouseCode?: string | null;
  billingBranch?: object | null;
}) {
  const hasBranch = overrides && 'billingBranch' in overrides
    ? overrides.billingBranch !== null
    : true;
  return {
    id: WAREHOUSE_ID,
    name: 'Bodega A',
    prefix:
      overrides && 'warehousePrefix' in overrides
        ? overrides.warehousePrefix
        : 'BDGA',
    code:
      overrides && 'warehouseCode' in overrides
        ? overrides.warehouseCode
        : 'ALM-001',
    tenant_id: TENANT_ID,
    billing_branch_id: hasBranch ? 'branch-1' : null,
    billing_branch: hasBranch
      ? {
          id: 'branch-1',
          code: 'SUCURSAL BUENOS AIRES',
          prefix:
            overrides && 'branchPrefix' in overrides
              ? overrides.branchPrefix
              : 'SBA',
          fiscal_configuration: {
            id: 'fiscal-1',
            prefix:
              overrides && 'fiscalPrefix' in overrides
                ? overrides.fiscalPrefix
                : 'MZN',
            razon_social: 'MADERERIA ZONA NORTE',
          },
        }
      : null,
  };
}

function mockSeqQuery(maxSeq: string | null) {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ maxSeq }),
  };
}

describe('BatchNumberGeneratorService', () => {
  let service: BatchNumberGeneratorService;
  let mockWarehouseRepository;
  let mockInventoryBatchRepository;

  beforeEach(async () => {
    mockWarehouseRepository = {
      findOne: jest.fn(),
    };

    mockInventoryBatchRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchNumberGeneratorService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockWarehouseRepository,
        },
        {
          provide: getRepositoryToken(InventoryBatch),
          useValue: mockInventoryBatchRepository,
        },
      ],
    }).compile();

    service = module.get<BatchNumberGeneratorService>(BatchNumberGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveLotSeries', () => {
    it('should compose razon-sucursal-almacen prefixes', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(warehouseWithPrefixes());

      const result = await service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID);

      expect(result).toEqual({
        fiscalPrefix: 'MZN',
        branchPrefix: 'SBA',
        warehousePrefix: 'BDGA',
        series: 'MZN-SBA-BDGA',
      });
    });

    it('should not use warehouse code as lot segment', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(
        warehouseWithPrefixes({ warehousePrefix: null, warehouseCode: 'BDGA' }),
      );

      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        'El almacén "Bodega A" no tiene prefijo',
      );
    });

    it('should throw when warehouse does not exist', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(null);

      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when warehouse has no branch', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(
        warehouseWithPrefixes({ billingBranch: null }),
      );

      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        'no está vinculado a una sucursal',
      );
    });

    it('should throw when fiscal prefix is missing', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(
        warehouseWithPrefixes({ fiscalPrefix: null }),
      );

      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        'La razón social no tiene prefijo',
      );
    });

    it('should throw when branch prefix is missing', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(
        warehouseWithPrefixes({ branchPrefix: null }),
      );

      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        'no tiene prefijo',
      );
    });

    it('should throw when warehouse prefix is missing', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(
        warehouseWithPrefixes({ warehousePrefix: null, warehouseCode: 'ALM-001' }),
      );

      await expect(service.resolveLotSeries(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        'El almacén "Bodega A" no tiene prefijo',
      );
    });
  });

  describe('generateBatchNumber', () => {
    it('should generate MZN-SBA-BDGA-00001', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(warehouseWithPrefixes());
      mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockSeqQuery(null));
      mockInventoryBatchRepository.findOne.mockResolvedValue(null);

      const result = await service.generateBatchNumber(WAREHOUSE_ID, TENANT_ID);
      expect(result).toBe('MZN-SBA-BDGA-00001');
    });

    it('should pad sequential number to 5 digits', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(warehouseWithPrefixes());
      mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockSeqQuery('10'));
      mockInventoryBatchRepository.findOne.mockResolvedValue(null);

      const result = await service.generateBatchNumber(WAREHOUSE_ID, TENANT_ID);
      expect(result).toBe('MZN-SBA-BDGA-00011');
    });

    it('should throw when collisions exhaust retries', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(warehouseWithPrefixes());
      mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockSeqQuery(null));
      mockInventoryBatchRepository.findOne.mockResolvedValue({
        id: 'existing',
        batch_number: 'MZN-SBA-BDGA-00001',
      });

      await expect(service.generateBatchNumber(WAREHOUSE_ID, TENANT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Property-Based Tests', () => {
    it('should match {razon}-{sucursal}-{almacen}-{5 digits}', async () => {
      const testCases = fc.sample(
        fc.tuple(
          fc.stringMatching(/^[A-Z]{2,4}$/),
          fc.stringMatching(/^[A-Z]{2,4}$/),
          fc.stringMatching(/^[A-Z]{2,4}$/),
        ),
        10,
      );

      for (const [fiscal, branch, warehouse] of testCases) {
        mockWarehouseRepository.findOne.mockResolvedValue(
          warehouseWithPrefixes({
            fiscalPrefix: fiscal,
            branchPrefix: branch,
            warehousePrefix: warehouse,
          }),
        );
        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockSeqQuery(null));
        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        const result = await service.generateBatchNumber(WAREHOUSE_ID, TENANT_ID);
        expect(result).toMatch(new RegExp(`^${fiscal}-${branch}-${warehouse}-\\d{5}$`));
      }
    });

    it('should increment sequential number', async () => {
      mockWarehouseRepository.findOne.mockResolvedValue(warehouseWithPrefixes());
      mockInventoryBatchRepository.findOne.mockResolvedValue(null);

      const batchNumbers: string[] = [];
      for (let i = 1; i <= 5; i++) {
        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(
          mockSeqQuery(i === 1 ? null : String(i - 1)),
        );
        batchNumbers.push(await service.generateBatchNumber(WAREHOUSE_ID, TENANT_ID));
      }

      expect(batchNumbers).toEqual([
        'MZN-SBA-BDGA-00001',
        'MZN-SBA-BDGA-00002',
        'MZN-SBA-BDGA-00003',
        'MZN-SBA-BDGA-00004',
        'MZN-SBA-BDGA-00005',
      ]);
    });
  });
});
