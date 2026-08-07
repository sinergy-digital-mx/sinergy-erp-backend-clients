import { ReceiptController } from './receipt.controller';
import { ReceiptService } from '../services/receipt.service';
import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';

/**
 * Integration Tests for Receipt Controller
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 11.2
 */
describe('ReceiptController - Integration Tests', () => {
  let controller: ReceiptController;
  let mockReceiptService: Partial<ReceiptService>;

  beforeEach(() => {
    mockReceiptService = {
      receive: jest.fn(),
    };

    controller = new ReceiptController(mockReceiptService as ReceiptService);
  });

  describe('POST /tenant/purchase-orders/:id/receipt - Successful Receipt', () => {
    it('should successfully receive a purchase order with valid data', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
        updated_by: userId,
        updated_at: new Date(),
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      const result = await controller.receive(poId, dto, mockReq);

      expect(result).toEqual(mockUpdatedPO);
      expect(mockReceiptService.receive).toHaveBeenCalledWith(
        poId,
        dto,
        tenantId,
        userId,
      );
    });

    it('should return updated PO with all received data', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
          {
            line_item_id: 'line-item-2',
            product_id: 'prod-2',
            uom_id: 'uom-2',
            quantity: 5,
            unit_total: 50,
            iva_percentage: 16,
            iva_unit: 8,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1250,
        received_iva_total: 200,
        received_ieps_total: 0,
        received_total: 1450,
        updated_by: userId,
        updated_at: new Date(),
        line_items: [
          {
            id: 'line-item-1',
            received_original_quantity: 10,
            received_converted_quantity: 10,
            received_original_uom_id: 'uom-1',
            received_converted_uom_id: 'uom-1',
            updated_by: userId,
            updated_at: new Date(),
          },
          {
            id: 'line-item-2',
            received_original_quantity: 5,
            received_converted_quantity: 5,
            received_original_uom_id: 'uom-2',
            received_converted_uom_id: 'uom-2',
            updated_by: userId,
            updated_at: new Date(),
          },
        ],
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      const result = await controller.receive(poId, dto, mockReq);

      expect(result.received_subtotal).toBe(1250);
      expect(result.received_iva_total).toBe(200);
      expect(result.received_total).toBe(1450);
      expect(result.line_items).toHaveLength(2);
    });

    it('should return PO with status updated to Recibida', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
        updated_by: userId,
        updated_at: new Date(),
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      const result = await controller.receive(poId, dto, mockReq);

      expect(result.general_status).toBe('Recibida');
    });

    it('should include updated line items with received data', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
        updated_by: userId,
        updated_at: new Date(),
        line_items: [
          {
            id: 'line-item-1',
            received_original_quantity: 10,
            received_converted_quantity: 10,
            received_original_uom_id: 'uom-1',
            received_converted_uom_id: 'uom-1',
            received_original_product_id: 'prod-1',
            received_original_unit_total: 100,
            received_original_iva_percentage: 16,
            received_original_iva_unit: 16,
            received_original_ieps_percentage: 0,
            received_original_ieps_unit: 0,
            updated_by: userId,
            updated_at: new Date(),
          },
        ],
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      const result = await controller.receive(poId, dto, mockReq);

      expect(result.line_items).toBeDefined();
      expect(result.line_items[0].received_original_quantity).toBe(10);
      expect(result.line_items[0].received_converted_quantity).toBe(10);
    });
  });

  describe('POST /tenant/purchase-orders/:id/receipt - Error Handling', () => {
    it('should throw error when purchase order not found', async () => {
      const poId = 'po-999';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      (mockReceiptService.receive as jest.Mock).mockRejectedValue(
        new Error('Orden de compra no encontrada'),
      );

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      await expect(controller.receive(poId, dto, mockReq)).rejects.toThrow(
        'Orden de compra no encontrada',
      );
    });

    it('should throw error when validation fails', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: -10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      (mockReceiptService.receive as jest.Mock).mockRejectedValue(
        new Error('Validation failed'),
      );

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      await expect(controller.receive(poId, dto, mockReq)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('should throw error for cross-tenant access', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      (mockReceiptService.receive as jest.Mock).mockRejectedValue(
        new Error('Purchase order does not belong to tenant'),
      );

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      await expect(controller.receive(poId, dto, mockReq)).rejects.toThrow(
        'Purchase order does not belong to tenant',
      );
    });
  });

  describe('POST /tenant/purchase-orders/:id/receipt - Request Context', () => {
    it('should extract tenant ID from request context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      await controller.receive(poId, dto, mockReq);

      expect(mockReceiptService.receive).toHaveBeenCalledWith(
        poId,
        dto,
        tenantId,
        userId,
      );
    });

    it('should extract user ID from authenticated request', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      await controller.receive(poId, dto, mockReq);

      const callArgs = (mockReceiptService.receive as jest.Mock).mock.calls[0];
      expect(callArgs[3]).toBe(userId);
    });
  });

  describe('POST /tenant/purchase-orders/:id/receipt - Response Format', () => {
    it('should return updated purchase order object', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
        updated_by: userId,
        updated_at: new Date(),
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      const result = await controller.receive(poId, dto, mockReq);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('general_status');
      expect(result).toHaveProperty('received_subtotal');
      expect(result).toHaveProperty('received_iva_total');
      expect(result).toHaveProperty('received_ieps_total');
      expect(result).toHaveProperty('received_total');
    });

    it('should return response with all required fields', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-1',
            product_id: 'prod-1',
            uom_id: 'uom-1',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockUpdatedPO: Partial<PurchaseOrderBatch> = {
        id: poId,
        general_status: 'Recibida',
        received_subtotal: 1000,
        received_iva_total: 160,
        received_ieps_total: 0,
        received_total: 1160,
        updated_by: userId,
        updated_at: new Date(),
      };

      (mockReceiptService.receive as jest.Mock).mockResolvedValue(mockUpdatedPO);

      const mockReq = {
        user: {
          tenant_id: tenantId,
          id: userId,
        },
      };

      const result = await controller.receive(poId, dto, mockReq);

      expect(result.id).toBe(poId);
      expect(result.general_status).toBe('Recibida');
      expect(result.received_subtotal).toBe(1000);
      expect(result.received_iva_total).toBe(160);
      expect(result.received_ieps_total).toBe(0);
      expect(result.received_total).toBe(1160);
    });
  });
});
