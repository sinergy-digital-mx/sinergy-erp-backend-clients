import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

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

  describe('Unit Tests', () => {
    describe('getWarehousePrefix', () => {
      it('should return warehouse prefix when warehouse exists', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const prefix = 'MH';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix,
        });

        const result = await service.getWarehousePrefix(warehouseId);
        expect(result).toBe(prefix);
      });

      it('should throw NotFoundException when warehouse does not exist', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';

        mockWarehouseRepository.findOne.mockResolvedValue(null);

        await expect(service.getWarehousePrefix(warehouseId)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.getWarehousePrefix(warehouseId)).rejects.toThrow(
          `Warehouse not found: ${warehouseId}`,
        );
      });

      it('should throw BadRequestException when warehouse has no prefix', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: null,
        });

        await expect(service.getWarehousePrefix(warehouseId)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.getWarehousePrefix(warehouseId)).rejects.toThrow(
          'does not have a prefix configured',
        );
      });
    });

    describe('getNextSequentialNumber', () => {
      it('should return 1 when no batches exist for warehouse', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: null }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getNextSequentialNumber(warehouseId, tenantId);
        expect(result).toBe(1);
      });

      it('should return next sequential number when batches exist', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: '42' }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getNextSequentialNumber(warehouseId, tenantId);
        expect(result).toBe(43);
      });

      it('should handle batch numbers with different prefixes', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'CD',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: '99' }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getNextSequentialNumber(warehouseId, tenantId);
        expect(result).toBe(100);
      });

      it('should return 1 when batch number format is invalid', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: '0' }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        const result = await service.getNextSequentialNumber(warehouseId, tenantId);
        expect(result).toBe(1);
      });
    });

    describe('generateBatchNumber', () => {
      it('should generate batch number with correct format', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: null }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        const result = await service.generateBatchNumber(warehouseId, tenantId);
        expect(result).toBe('MH-LOTE-000001');
      });

      it('should zero-pad sequential number to 6 digits', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'CD',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: '99' }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        const result = await service.generateBatchNumber(warehouseId, tenantId);
        expect(result).toBe('CD-LOTE-000100');
      });

      it('should throw BadRequestException when batch number already exists', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: null }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockInventoryBatchRepository.findOne.mockResolvedValue({
          id: 'existing-batch-id',
          batch_number: 'MH-LOTE-000001',
        });

        await expect(
          service.generateBatchNumber(warehouseId, tenantId),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.generateBatchNumber(warehouseId, tenantId),
        ).rejects.toThrow('Unable to generate a unique batch number');
      });

      it('should throw NotFoundException when warehouse does not exist', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue(null);

        await expect(
          service.generateBatchNumber(warehouseId, tenantId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException when warehouse has no prefix', async () => {
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: null,
        });

        await expect(
          service.generateBatchNumber(warehouseId, tenantId),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 5: Batch Number Format Compliance', () => {
      it('should generate batch numbers matching pattern {prefix}-LOTE-{6_digit_sequential}', async () => {
        // **Validates: Requirements 3.2, 12.2, 12.3**
        const testCases = fc.sample(
          fc.tuple(
            fc.stringMatching(/^[A-Z]{2,3}$/), // 2-3 uppercase letters for prefix
            fc.uuid(), // warehouseId
            fc.uuid(), // tenantId
          ),
          10,
        );

        for (const [prefix, warehouseId, tenantId] of testCases) {
          mockWarehouseRepository.findOne.mockResolvedValue({
            id: warehouseId,
            prefix,
          });

          const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ maxSeq: null }),
          };

          mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
          mockInventoryBatchRepository.findOne.mockResolvedValue(null);

          const result = await service.generateBatchNumber(warehouseId, tenantId);

          // Verify format: {prefix}-LOTE-{6_digit_sequential}
          const pattern = new RegExp(`^${prefix}-LOTE-\\d{6}$`);
          expect(result).toMatch(pattern);
        }
      });
    });

    describe('Property 6: Batch Number Uniqueness Within Tenant', () => {
      it('should reject duplicate batch numbers within same tenant', async () => {
        // **Validates: Requirements 3.5, 11.4, 12.5**
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';
        const batchNumber = 'MH-LOTE-000001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: null }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        // First call succeeds
        mockInventoryBatchRepository.findOne.mockResolvedValue(null);
        const result1 = await service.generateBatchNumber(warehouseId, tenantId);
        expect(result1).toBe(batchNumber);

        // Second call with same batch number should retry until exhausted
        mockInventoryBatchRepository.findOne.mockResolvedValue({
          id: 'existing-batch-id',
          batch_number: batchNumber,
        });

        await expect(
          service.generateBatchNumber(warehouseId, tenantId),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('Property 24: Batch Number Sequential Increment', () => {
      it('should increment sequential number for each new batch in warehouse', async () => {
        // **Validates: Requirements 3.4, 12.4**
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        // Generate multiple batch numbers
        const batchNumbers: string[] = [];

        for (let i = 1; i <= 5; i++) {
          const mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({
              maxSeq: i === 1 ? null : String(i - 1),
            }),
          };

          mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

          const result = await service.generateBatchNumber(warehouseId, tenantId);
          batchNumbers.push(result);
        }

        // Verify sequential increment
        expect(batchNumbers[0]).toBe('MH-LOTE-000001');
        expect(batchNumbers[1]).toBe('MH-LOTE-000002');
        expect(batchNumbers[2]).toBe('MH-LOTE-000003');
        expect(batchNumbers[3]).toBe('MH-LOTE-000004');
        expect(batchNumbers[4]).toBe('MH-LOTE-000005');
      });

      it('should handle large sequential numbers with proper zero-padding', async () => {
        // **Validates: Requirements 3.4, 12.4**
        const warehouseId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockWarehouseRepository.findOne.mockResolvedValue({
          id: warehouseId,
          prefix: 'MH',
        });

        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxSeq: '999999' }),
        };

        mockInventoryBatchRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        const result = await service.generateBatchNumber(warehouseId, tenantId);
        expect(result).toBe('MH-LOTE-1000000');
      });
    });
  });
});
