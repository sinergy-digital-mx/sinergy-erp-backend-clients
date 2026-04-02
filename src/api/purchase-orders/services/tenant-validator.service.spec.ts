import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantValidatorService } from './tenant-validator.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';

describe('TenantValidatorService', () => {
  let service: TenantValidatorService;
  let mockPurchaseOrderRepository;
  let mockInventoryBatchRepository;

  beforeEach(async () => {
    mockPurchaseOrderRepository = {
      findOne: jest.fn(),
    };

    mockInventoryBatchRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantValidatorService,
        {
          provide: getRepositoryToken(PurchaseOrderBatch),
          useValue: mockPurchaseOrderRepository,
        },
        {
          provide: getRepositoryToken(InventoryBatch),
          useValue: mockInventoryBatchRepository,
        },
      ],
    }).compile();

    service = module.get<TenantValidatorService>(TenantValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Unit Tests', () => {
    describe('validatePOBelongsToTenant', () => {
      it('should pass validation when PO belongs to tenant', async () => {
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockPurchaseOrderRepository.findOne.mockResolvedValue({
          id: purchaseOrderId,
          tenant_id: tenantId,
          folio: 'ODC-000001',
        });

        // Should not throw
        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, tenantId),
        ).resolves.toBeUndefined();
      });

      it('should throw NotFoundException when PO does not exist', async () => {
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockPurchaseOrderRepository.findOne.mockResolvedValue(null);

        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, tenantId),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, tenantId),
        ).rejects.toThrow(`Purchase order not found: ${purchaseOrderId}`);
      });

      it('should throw NotFoundException when PO belongs to different tenant', async () => {
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';
        const differentTenantId = '550e8400-e29b-41d4-a716-446655440002';

        mockPurchaseOrderRepository.findOne.mockResolvedValue(null);

        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, tenantId),
        ).rejects.toThrow(NotFoundException);
      });

      it('should query with correct tenant_id filter', async () => {
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockPurchaseOrderRepository.findOne.mockResolvedValue({
          id: purchaseOrderId,
          tenant_id: tenantId,
        });

        await service.validatePOBelongsToTenant(purchaseOrderId, tenantId);

        expect(mockPurchaseOrderRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: purchaseOrderId,
            tenant_id: tenantId,
          },
        });
      });
    });

    describe('verifyBatchNumberUniquenessWithinTenant', () => {
      it('should pass verification when batch number does not exist', async () => {
        const batchNumber = 'MH-LOTE-000001';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        // Should not throw
        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId),
        ).resolves.toBeUndefined();
      });

      it('should throw BadRequestException when batch number already exists', async () => {
        const batchNumber = 'MH-LOTE-000001';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockInventoryBatchRepository.findOne.mockResolvedValue({
          id: 'existing-batch-id',
          batch_number: batchNumber,
          tenant_id: tenantId,
        });

        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId),
        ).rejects.toThrow(`Batch number ${batchNumber} already exists`);
      });

      it('should query with correct batch_number and tenant_id filters', async () => {
        const batchNumber = 'MH-LOTE-000001';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        await service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId);

        expect(mockInventoryBatchRepository.findOne).toHaveBeenCalledWith({
          where: {
            batch_number: batchNumber,
            tenant_id: tenantId,
          },
        });
      });

      it('should allow same batch number in different tenant', async () => {
        const batchNumber = 'MH-LOTE-000001';
        const tenantId1 = '550e8400-e29b-41d4-a716-446655440001';
        const tenantId2 = '550e8400-e29b-41d4-a716-446655440002';

        mockInventoryBatchRepository.findOne.mockResolvedValue(null);

        // Should not throw for either tenant
        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId1),
        ).resolves.toBeUndefined();

        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId2),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 23: Tenant Isolation', () => {
      it('should only access data belonging to specified tenant', async () => {
        // **Validates: Requirements 11.1, 11.3**
        const testCases = fc.sample(
          fc.tuple(
            fc.uuid(), // purchaseOrderId
            fc.uuid(), // tenantId
          ),
          10,
        );

        for (const [purchaseOrderId, tenantId] of testCases) {
          mockPurchaseOrderRepository.findOne.mockResolvedValue({
            id: purchaseOrderId,
            tenant_id: tenantId,
          });

          await service.validatePOBelongsToTenant(purchaseOrderId, tenantId);

          // Verify that the query includes tenant_id filter
          const callArgs = mockPurchaseOrderRepository.findOne.mock.calls[
            mockPurchaseOrderRepository.findOne.mock.calls.length - 1
          ][0];

          expect(callArgs.where.tenant_id).toBe(tenantId);
          expect(callArgs.where.id).toBe(purchaseOrderId);
        }
      });

      it('should enforce tenant isolation for batch numbers', async () => {
        // **Validates: Requirements 11.1, 11.3**
        const batchNumber = 'MH-LOTE-000001';
        const tenantId1 = '550e8400-e29b-41d4-a716-446655440001';
        const tenantId2 = '550e8400-e29b-41d4-a716-446655440002';

        // Batch exists for tenant1
        mockInventoryBatchRepository.findOne.mockImplementation((query) => {
          if (query.where.tenant_id === tenantId1) {
            return Promise.resolve({
              id: 'batch-id',
              batch_number: batchNumber,
              tenant_id: tenantId1,
            });
          }
          return Promise.resolve(null);
        });

        // Should fail for tenant1
        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId1),
        ).rejects.toThrow(BadRequestException);

        // Should pass for tenant2
        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId2),
        ).resolves.toBeUndefined();
      });
    });

    describe('Property 27: Cross-Tenant Access Prevention', () => {
      it('should prevent access to PO from different tenant', async () => {
        // **Validates: Requirements 11.2**
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const requestedTenantId = '550e8400-e29b-41d4-a716-446655440001';
        const actualTenantId = '550e8400-e29b-41d4-a716-446655440002';

        // PO exists but belongs to different tenant
        mockPurchaseOrderRepository.findOne.mockResolvedValue(null);

        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, requestedTenantId),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, requestedTenantId),
        ).rejects.toThrow(`Purchase order not found: ${purchaseOrderId}`);
      });

      it('should return NotFoundException (not Forbidden) for cross-tenant access', async () => {
        // **Validates: Requirements 11.2**
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const requestedTenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockPurchaseOrderRepository.findOne.mockResolvedValue(null);

        const error = await service
          .validatePOBelongsToTenant(purchaseOrderId, requestedTenantId)
          .catch((e) => e);

        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toContain('Purchase order not found');
      });

      it('should use tenant_id in query to prevent cross-tenant access', async () => {
        // **Validates: Requirements 11.2**
        const purchaseOrderId = '550e8400-e29b-41d4-a716-446655440000';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockPurchaseOrderRepository.findOne.mockResolvedValue(null);

        await expect(
          service.validatePOBelongsToTenant(purchaseOrderId, tenantId),
        ).rejects.toThrow(NotFoundException);

        // Verify tenant_id is included in the query
        const callArgs = mockPurchaseOrderRepository.findOne.mock.calls[0][0];
        expect(callArgs.where).toHaveProperty('tenant_id', tenantId);
      });
    });

    describe('Property 11.4: Batch Number Uniqueness Within Tenant', () => {
      it('should verify batch number uniqueness scoped to tenant', async () => {
        // **Validates: Requirements 11.4**
        const testCases = fc.sample(
          fc.tuple(
            fc.stringMatching(/^[A-Z]{2,3}-LOTE-\d{6}$/), // batch number format
            fc.uuid(), // tenantId
          ),
          10,
        );

        for (const [batchNumber, tenantId] of testCases) {
          mockInventoryBatchRepository.findOne.mockResolvedValue(null);

          await service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId);

          const callArgs = mockInventoryBatchRepository.findOne.mock.calls[
            mockInventoryBatchRepository.findOne.mock.calls.length - 1
          ][0];

          expect(callArgs.where.batch_number).toBe(batchNumber);
          expect(callArgs.where.tenant_id).toBe(tenantId);
        }
      });

      it('should reject duplicate batch numbers within same tenant', async () => {
        // **Validates: Requirements 11.4**
        const batchNumber = 'MH-LOTE-000001';
        const tenantId = '550e8400-e29b-41d4-a716-446655440001';

        mockInventoryBatchRepository.findOne.mockResolvedValue({
          id: 'batch-id',
          batch_number: batchNumber,
          tenant_id: tenantId,
        });

        await expect(
          service.verifyBatchNumberUniquenessWithinTenant(batchNumber, tenantId),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
