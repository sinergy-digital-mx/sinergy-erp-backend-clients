import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { POStatusUpdaterService } from './po-status-updater.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';

describe('POStatusUpdaterService - Property-Based Tests', () => {
  let service: POStatusUpdaterService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POStatusUpdaterService,
        {
          provide: getRepositoryToken(PurchaseOrderBatch),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<POStatusUpdaterService>(POStatusUpdaterService);
  });

  /**
   * Property 12: PO Status Updated to Recibida
   * For any successful receipt, the purchase order's general_status SHALL be updated to "Recibida"
   * Validates: Requirements 4.1
   */
  describe('Property 12: PO Status Updated to Recibida', () => {
    it('should always update status to "Recibida" for any valid purchase order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (purchaseOrderId, userId) => {
            const mockPO = {
              id: purchaseOrderId,
              general_status: 'Creada',
              updated_by: null,
              updated_at: new Date('2024-01-01'),
            };

            mockRepository.findOne.mockResolvedValue(mockPO);
            mockRepository.save.mockResolvedValue(mockPO);

            await service.updatePOStatusToRecibida(purchaseOrderId, userId);

            expect(mockPO.general_status).toBe('Recibida');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 13: PO Audit Fields Updated
   * For any successful receipt, the purchase order's updated_by SHALL be the current user ID,
   * and updated_at SHALL be a recent timestamp
   * Validates: Requirements 4.2, 4.3
   */
  describe('Property 13: PO Audit Fields Updated', () => {
    it('should always set updated_by to the provided user ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (purchaseOrderId, userId) => {
            const mockPO = {
              id: purchaseOrderId,
              general_status: 'Creada',
              updated_by: null,
              updated_at: new Date('2024-01-01'),
            };

            mockRepository.findOne.mockResolvedValue(mockPO);
            mockRepository.save.mockResolvedValue(mockPO);

            await service.updatePOStatusToRecibida(purchaseOrderId, userId);

            expect(mockPO.updated_by).toBe(userId);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always set updated_at to a recent timestamp', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (purchaseOrderId, userId) => {
            const beforeUpdate = new Date();

            const mockPO = {
              id: purchaseOrderId,
              general_status: 'Creada',
              updated_by: null,
              updated_at: new Date('2024-01-01'),
            };

            mockRepository.findOne.mockResolvedValue(mockPO);
            mockRepository.save.mockResolvedValue(mockPO);

            await service.updatePOStatusToRecibida(purchaseOrderId, userId);

            const afterUpdate = new Date();

            expect(mockPO.updated_at.getTime()).toBeGreaterThanOrEqual(
              beforeUpdate.getTime(),
            );
            expect(mockPO.updated_at.getTime()).toBeLessThanOrEqual(
              afterUpdate.getTime(),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always persist changes to database', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.uuid(),
          async (purchaseOrderId, userId) => {
            const mockPO = {
              id: purchaseOrderId,
              general_status: 'Creada',
              updated_by: null,
              updated_at: new Date('2024-01-01'),
            };

            mockRepository.findOne.mockResolvedValue(mockPO);
            mockRepository.save.mockResolvedValue(mockPO);

            await service.updatePOStatusToRecibida(purchaseOrderId, userId);

            expect(mockRepository.save).toHaveBeenCalledWith(mockPO);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
