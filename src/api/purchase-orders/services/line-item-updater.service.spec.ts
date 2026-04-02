import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { LineItemUpdaterService } from './line-item-updater.service';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

describe('LineItemUpdaterService', () => {
  let service: LineItemUpdaterService;
  let lineItemRepository: Repository<PurchaseOrderBatchDetail>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineItemUpdaterService,
        {
          provide: getRepositoryToken(PurchaseOrderBatchDetail),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LineItemUpdaterService>(LineItemUpdaterService);
    lineItemRepository = module.get<Repository<PurchaseOrderBatchDetail>>(
      getRepositoryToken(PurchaseOrderBatchDetail),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateLineItemWithReceivedData', () => {
    const lineItemId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = 'user-123';
    const baseUomId = 'uom-base-001';
    const convertedQuantity = 100.5;

    const receivedItem: ReceivedItemDto = {
      line_item_id: lineItemId,
      product_id: 'product-001',
      uom_id: 'uom-001',
      quantity: 50.25,
      unit_total: 100.0,
      iva_percentage: 16.0,
      iva_unit: 16.0,
      ieps_percentage: 0.0,
      ieps_unit: 0.0,
    };

    it('should update line item with received data', async () => {
      const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId,
        purchase_order_batch_id: 'po-001',
        product_id: 'product-001',
        uom_id: 'uom-001',
        quantity: 50.0,
        unit_total: 100.0,
        iva_percentage: 16.0,
        iva_unit: 16.0,
        ieps_percentage: 0.0,
        ieps_unit: 0.0,
        received_original_product_id: null,
        received_original_uom_id: null,
        received_original_quantity: null,
        received_original_unit_total: null,
        received_original_iva_percentage: null,
        received_original_iva_unit: null,
        received_original_ieps_percentage: null,
        received_original_ieps_unit: null,
        received_converted_quantity: null,
        received_converted_uom_id: null,
        updated_by: null,
        updated_at: new Date(),
      };

      jest.spyOn(lineItemRepository, 'findOne').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
      jest.spyOn(lineItemRepository, 'save').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);

      await service.updateLineItemWithReceivedData(
        lineItemId,
        receivedItem,
        convertedQuantity,
        baseUomId,
        userId,
      );

      expect(lineItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: lineItemId },
      });

      expect(lineItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: lineItemId,
          received_original_product_id: receivedItem.product_id,
          received_original_uom_id: receivedItem.uom_id,
          received_original_quantity: receivedItem.quantity,
          received_original_unit_total: receivedItem.unit_total,
          received_original_iva_percentage: receivedItem.iva_percentage,
          received_original_iva_unit: receivedItem.iva_unit,
          received_original_ieps_percentage: receivedItem.ieps_percentage,
          received_original_ieps_unit: receivedItem.ieps_unit,
          received_converted_quantity: convertedQuantity,
          received_converted_uom_id: baseUomId,
          updated_by: userId,
        }),
      );
    });

    it('should store all received_original_* fields from the received item', async () => {
      const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId,
        received_original_product_id: null,
        received_original_uom_id: null,
        received_original_quantity: null,
        received_original_unit_total: null,
        received_original_iva_percentage: null,
        received_original_iva_unit: null,
        received_original_ieps_percentage: null,
        received_original_ieps_unit: null,
        updated_at: new Date(),
      };

      jest.spyOn(lineItemRepository, 'findOne').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
      jest.spyOn(lineItemRepository, 'save').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);

      await service.updateLineItemWithReceivedData(
        lineItemId,
        receivedItem,
        convertedQuantity,
        baseUomId,
        userId,
      );

      const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedItem.received_original_product_id).toBe(receivedItem.product_id);
      expect(savedItem.received_original_uom_id).toBe(receivedItem.uom_id);
      expect(savedItem.received_original_quantity).toBe(receivedItem.quantity);
      expect(savedItem.received_original_unit_total).toBe(receivedItem.unit_total);
      expect(savedItem.received_original_iva_percentage).toBe(receivedItem.iva_percentage);
      expect(savedItem.received_original_iva_unit).toBe(receivedItem.iva_unit);
      expect(savedItem.received_original_ieps_percentage).toBe(receivedItem.ieps_percentage);
      expect(savedItem.received_original_ieps_unit).toBe(receivedItem.ieps_unit);
    });

    it('should store received_converted_* fields', async () => {
      const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId,
        received_converted_quantity: null,
        received_converted_uom_id: null,
        updated_at: new Date(),
      };

      jest.spyOn(lineItemRepository, 'findOne').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
      jest.spyOn(lineItemRepository, 'save').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);

      await service.updateLineItemWithReceivedData(
        lineItemId,
        receivedItem,
        convertedQuantity,
        baseUomId,
        userId,
      );

      const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedItem.received_converted_quantity).toBe(convertedQuantity);
      expect(savedItem.received_converted_uom_id).toBe(baseUomId);
    });

    it('should update audit fields (updated_by, updated_at)', async () => {
      const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId,
        updated_by: null,
        updated_at: new Date('2024-01-01'),
      };

      jest.spyOn(lineItemRepository, 'findOne').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
      jest.spyOn(lineItemRepository, 'save').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);

      const beforeUpdate = new Date();
      await service.updateLineItemWithReceivedData(
        lineItemId,
        receivedItem,
        convertedQuantity,
        baseUomId,
        userId,
      );
      const afterUpdate = new Date();

      const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedItem.updated_by).toBe(userId);
      expect(savedItem.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(savedItem.updated_at.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });

    it('should throw NotFoundException when line item does not exist', async () => {
      jest.spyOn(lineItemRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateLineItemWithReceivedData(
          lineItemId,
          receivedItem,
          convertedQuantity,
          baseUomId,
          userId,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.updateLineItemWithReceivedData(
          lineItemId,
          receivedItem,
          convertedQuantity,
          baseUomId,
          userId,
        ),
      ).rejects.toThrow(`Line item not found: ${lineItemId}`);
    });

    it('should persist changes to database', async () => {
      const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId,
        updated_at: new Date(),
      };

      jest.spyOn(lineItemRepository, 'findOne').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
      jest.spyOn(lineItemRepository, 'save').mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);

      await service.updateLineItemWithReceivedData(
        lineItemId,
        receivedItem,
        convertedQuantity,
        baseUomId,
        userId,
      );

      expect(lineItemRepository.save).toHaveBeenCalled();
    });

    it('should handle multiple line item updates independently', async () => {
      const lineItemId2 = '550e8400-e29b-41d4-a716-446655440001';
      const mockLineItem1: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId,
        updated_at: new Date(),
      };
      const mockLineItem2: Partial<PurchaseOrderBatchDetail> = {
        id: lineItemId2,
        updated_at: new Date(),
      };

      jest
        .spyOn(lineItemRepository, 'findOne')
        .mockResolvedValueOnce(mockLineItem1 as PurchaseOrderBatchDetail)
        .mockResolvedValueOnce(mockLineItem2 as PurchaseOrderBatchDetail);

      jest.spyOn(lineItemRepository, 'save').mockResolvedValue({} as PurchaseOrderBatchDetail);

      const receivedItem2: ReceivedItemDto = {
        ...receivedItem,
        line_item_id: lineItemId2,
        quantity: 75.5,
      };

      await service.updateLineItemWithReceivedData(
        lineItemId,
        receivedItem,
        convertedQuantity,
        baseUomId,
        userId,
      );

      await service.updateLineItemWithReceivedData(
        lineItemId2,
        receivedItem2,
        200.0,
        baseUomId,
        userId,
      );

      expect(lineItemRepository.save).toHaveBeenCalledTimes(2);
      const firstCall = (lineItemRepository.save as jest.Mock).mock.calls[0][0];
      const secondCall = (lineItemRepository.save as jest.Mock).mock.calls[1][0];

      expect(firstCall.received_original_quantity).toBe(receivedItem.quantity);
      expect(secondCall.received_original_quantity).toBe(receivedItem2.quantity);
    });
  });
});
