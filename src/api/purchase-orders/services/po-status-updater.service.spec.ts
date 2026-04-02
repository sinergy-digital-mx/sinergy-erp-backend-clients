import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { POStatusUpdaterService } from './po-status-updater.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';

describe('POStatusUpdaterService', () => {
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

  describe('updatePOStatusToRecibida', () => {
    it('should update status to "Recibida" and set audit fields', async () => {
      const purchaseOrderId = 'po-123';
      const userId = 'user-456';
      const now = new Date();

      const mockPO = {
        id: purchaseOrderId,
        general_status: 'Creada',
        updated_by: null,
        updated_at: new Date('2024-01-01'),
      };

      mockRepository.findOne.mockResolvedValue(mockPO);
      mockRepository.save.mockResolvedValue(mockPO);

      await service.updatePOStatusToRecibida(purchaseOrderId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: purchaseOrderId },
      });

      expect(mockPO.general_status).toBe('Recibida');
      expect(mockPO.updated_by).toBe(userId);
      expect(mockPO.updated_at).toBeInstanceOf(Date);
      expect(mockRepository.save).toHaveBeenCalledWith(mockPO);
    });

    it('should throw NotFoundException if purchase order not found', async () => {
      const purchaseOrderId = 'non-existent-po';
      const userId = 'user-456';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePOStatusToRecibida(purchaseOrderId, userId),
      ).rejects.toThrow(
        new NotFoundException(`Purchase order not found: ${purchaseOrderId}`),
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: purchaseOrderId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should persist changes to database', async () => {
      const purchaseOrderId = 'po-123';
      const userId = 'user-456';

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
    });

    it('should update audit fields with current timestamp', async () => {
      const purchaseOrderId = 'po-123';
      const userId = 'user-456';
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

      expect(mockPO.updated_by).toBe(userId);
      expect(mockPO.updated_at.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(mockPO.updated_at.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });
});
