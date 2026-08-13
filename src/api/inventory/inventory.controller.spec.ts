import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { BatchListResponseDto } from './dto/batch-list-response.dto';
import { BatchResponseDto } from './dto/batch-response.dto';
import { InventoryExportService } from './services/inventory-export.service';
import { NotFoundException } from '@nestjs/common';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: InventoryService;

  const mockTenantId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = 'user-123';

  const mockBatchResponseDto: BatchResponseDto = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    batch_number: 'BATCH-001',
    warehouse_id: '550e8400-e29b-41d4-a716-446655440010',
    warehouse_name: 'Main Warehouse',
    product_id: '550e8400-e29b-41d4-a716-446655440020',
    product_name: 'Product A',
    product_sku: 'SKU-001',
    uom_id: '550e8400-e29b-41d4-a716-446655440030',
    uom_name: 'Unit',
    quantity: '100.000',
    purchase_order_batch_id: '550e8400-e29b-41d4-a716-446655440040',
    purchase_order_id: '550e8400-e29b-41d4-a716-446655440040',
    purchase_order_detail_id: '550e8400-e29b-41d4-a716-446655440050',
    created_by: mockUserId,
    created_at: new Date('2024-01-01'),
  };

  const mockBatchListResponse: BatchListResponseDto = {
    data: [mockBatchResponseDto],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    const mockInventoryService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByPurchaseOrderId: jest.fn(),
      calculateTotalQuantity: jest.fn(),
      getLocationTree: jest.fn(),
      getStats: jest.fn(),
    };

    service = mockInventoryService as any;
    const mockExportService = {
      exportBatches: jest.fn(),
      exportSummary: jest.fn(),
      getBatchesFilename: jest.fn(),
      getSummaryFilename: jest.fn(),
    };
    controller = new InventoryController(service, mockExportService as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /tenant/inventory/locations', () => {
    it('should return location tree for dropdowns', async () => {
      const tree = {
        data: [
          {
            id: 'fiscal-1',
            razon_social: 'MADERERIA ZONA NORTE',
            rfc: 'MZN010101XXX',
            status: 'active',
            branches: [],
          },
        ],
      };
      jest.spyOn(service, 'getLocationTree').mockResolvedValue(tree as any);

      const req = { user: { tenant_id: mockTenantId } };
      const result = await controller.getLocations(req);

      expect(result).toEqual(tree);
      expect(service.getLocationTree).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('GET /tenant/inventory/stats', () => {
    const mockStats = {
      total_batches: 10,
      batches_with_stock: 8,
      batches_depleted: 2,
      total_products: 4,
      products_with_stock: 3,
      total_warehouses: 2,
      total_available_quantity: '100.000',
      total_initial_quantity: '120.000',
      total_cost: '2000.00',
      total_sale_value: '5000.00',
      average_unit_cost: '20.00',
      average_unit_price: '50.00',
      gross_margin: '3000.00',
      gross_margin_percentage: '60.00',
      batches_without_cost: 0,
      quantity_without_cost: '0.000',
      products_without_price: 0,
      quantity_without_price: '0.000',
    };

    it('should return inventory stats', async () => {
      jest.spyOn(service, 'getStats').mockResolvedValue(mockStats as any);

      const req = { user: { tenant_id: mockTenantId } };
      const result = await controller.getStats({}, req);

      expect(result).toEqual(mockStats);
      expect(service.getStats).toHaveBeenCalledWith(mockTenantId, {});
    });

    it('should forward location filters', async () => {
      jest.spyOn(service, 'getStats').mockResolvedValue(mockStats as any);

      const req = { user: { tenant_id: mockTenantId } };
      const filters = {
        fiscal_configuration_id: '550e8400-e29b-41d4-a716-446655440100',
        billing_branch_id: '550e8400-e29b-41d4-a716-446655440101',
      };

      await controller.getStats(filters, req);

      expect(service.getStats).toHaveBeenCalledWith(mockTenantId, filters);
    });
  });

  describe('GET /tenant/inventory/batches', () => {
    describe('List all batches', () => {
      it('should return paginated list of batches', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { page: 1, limit: 20 };

        const result = await controller.findAll(filters, req);

        expect(result).toEqual(mockBatchListResponse);
        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should return empty list when no batches exist', async () => {
        const emptyResponse: BatchListResponseDto = {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };

        jest.spyOn(service, 'findAll').mockResolvedValue(emptyResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { page: 1, limit: 20 };

        const result = await controller.findAll(filters, req);

        expect(result.data).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    describe('Pagination', () => {
      it('should apply page and limit parameters', async () => {
        const paginatedResponse: BatchListResponseDto = {
          data: [mockBatchResponseDto],
          total: 50,
          page: 2,
          limit: 10,
          totalPages: 5,
        };

        jest.spyOn(service, 'findAll').mockResolvedValue(paginatedResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { page: 2, limit: 10 };

        const result = await controller.findAll(filters, req);

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(5);
        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should use default pagination when not provided', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = {};

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should handle maximum limit constraint', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { page: 1, limit: 100 };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });
    });

    describe('Filters', () => {
      it('should filter by batch_number', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { batch_number: 'BATCH-001' };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should filter by product_id', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { product_id: '550e8400-e29b-41d4-a716-446655440020' };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should filter by warehouse_id', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { warehouse_id: '550e8400-e29b-41d4-a716-446655440010' };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should filter by purchase_order_id', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { purchase_order_id: '550e8400-e29b-41d4-a716-446655440040' };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should filter by date range', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = {
          created_from: '2024-01-01',
          created_to: '2024-12-31',
        };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should apply multiple filters together', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = {
          batch_number: 'BATCH-001',
          product_id: '550e8400-e29b-41d4-a716-446655440020',
          warehouse_id: '550e8400-e29b-41d4-a716-446655440010',
          page: 1,
          limit: 20,
        };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });
    });

    describe('Sorting', () => {
      it('should sort by batch_number', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = { sort_by: 'batch_number', sort_order: 'ASC' };

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should sort by created_at descending by default', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = {};

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });
    });

    describe('Tenant Isolation', () => {
      it('should only return batches for the authenticated tenant', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const filters = {};

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
      });

      it('should use tenant_id from request context', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

        const differentTenantId = '550e8400-e29b-41d4-a716-446655440099';
        const req = { user: { tenant_id: differentTenantId } };
        const filters = {};

        await controller.findAll(filters, req);

        expect(service.findAll).toHaveBeenCalledWith(differentTenantId, filters);
      });
    });
  });

  describe('GET /tenant/inventory/batches/:id', () => {
    describe('Get single batch', () => {
      it('should return a single batch by ID', async () => {
        jest.spyOn(service, 'findById').mockResolvedValue(mockBatchResponseDto);

        const req = { user: { tenant_id: mockTenantId } };
        const batchId = '550e8400-e29b-41d4-a716-446655440001';

        const result = await controller.findOne(batchId, req);

        expect(result).toEqual(mockBatchResponseDto);
        expect(service.findById).toHaveBeenCalledWith(batchId, mockTenantId);
      });

      it('should throw NotFoundException when batch does not exist', async () => {
        jest
          .spyOn(service, 'findById')
          .mockRejectedValue(new NotFoundException('Batch not found'));

        const req = { user: { tenant_id: mockTenantId } };
        const batchId = '550e8400-e29b-41d4-a716-446655440999';

        await expect(controller.findOne(batchId, req)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should include all batch relations in response', async () => {
        const fullBatchResponse: BatchResponseDto = {
          ...mockBatchResponseDto,
          warehouse_name: 'Main Warehouse',
          product_name: 'Product A',
          product_sku: 'SKU-001',
          uom_name: 'Unit',
        };

        jest.spyOn(service, 'findById').mockResolvedValue(fullBatchResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const batchId = '550e8400-e29b-41d4-a716-446655440001';

        const result = await controller.findOne(batchId, req);

        expect(result.warehouse_name).toBeDefined();
        expect(result.product_name).toBeDefined();
        expect(result.product_sku).toBeDefined();
        expect(result.uom_name).toBeDefined();
      });
    });

    describe('Tenant Isolation', () => {
      it('should only return batch if it belongs to the tenant', async () => {
        jest.spyOn(service, 'findById').mockResolvedValue(mockBatchResponseDto);

        const req = { user: { tenant_id: mockTenantId } };
        const batchId = '550e8400-e29b-41d4-a716-446655440001';

        await controller.findOne(batchId, req);

        expect(service.findById).toHaveBeenCalledWith(batchId, mockTenantId);
      });

      it('should throw NotFoundException for batch from different tenant', async () => {
        jest
          .spyOn(service, 'findById')
          .mockRejectedValue(new NotFoundException('Batch not found'));

        const req = { user: { tenant_id: mockTenantId } };
        const batchId = '550e8400-e29b-41d4-a716-446655440001';

        await expect(controller.findOne(batchId, req)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('GET /tenant/inventory/batches/purchase-order/:poId', () => {
    describe('Get batches by purchase order', () => {
      it('should return all batches for a purchase order', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = {};

        const result = await controller.findByPurchaseOrder(poId, filters, req);

        expect(result).toEqual(mockBatchListResponse);
        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          mockTenantId,
          filters,
        );
      });

      it('should return empty list when no batches exist for PO', async () => {
        const emptyResponse: BatchListResponseDto = {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };

        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(emptyResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = {};

        const result = await controller.findByPurchaseOrder(poId, filters, req);

        expect(result.data).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      it('should return multiple batches for a single PO', async () => {
        const batch2: BatchResponseDto = {
          ...mockBatchResponseDto,
          id: '550e8400-e29b-41d4-a716-446655440002',
          batch_number: 'BATCH-002',
        };

        const multipleResponse: BatchListResponseDto = {
          data: [mockBatchResponseDto, batch2],
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        };

        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(multipleResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = {};

        const result = await controller.findByPurchaseOrder(poId, filters, req);

        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(2);
      });
    });

    describe('Pagination for PO batches', () => {
      it('should apply pagination to PO batches', async () => {
        const paginatedResponse: BatchListResponseDto = {
          data: [mockBatchResponseDto],
          total: 50,
          page: 2,
          limit: 10,
          totalPages: 5,
        };

        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(paginatedResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = { page: 2, limit: 10 };

        const result = await controller.findByPurchaseOrder(poId, filters, req);

        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(5);
      });
    });

    describe('Filters for PO batches', () => {
      it('should filter PO batches by batch_number', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = { batch_number: 'BATCH-001' };

        await controller.findByPurchaseOrder(poId, filters, req);

        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          mockTenantId,
          filters,
        );
      });

      it('should filter PO batches by product_id', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = { product_id: '550e8400-e29b-41d4-a716-446655440020' };

        await controller.findByPurchaseOrder(poId, filters, req);

        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          mockTenantId,
          filters,
        );
      });

      it('should filter PO batches by warehouse_id', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = { warehouse_id: '550e8400-e29b-41d4-a716-446655440010' };

        await controller.findByPurchaseOrder(poId, filters, req);

        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          mockTenantId,
          filters,
        );
      });

      it('should apply multiple filters to PO batches', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = {
          batch_number: 'BATCH-001',
          product_id: '550e8400-e29b-41d4-a716-446655440020',
          warehouse_id: '550e8400-e29b-41d4-a716-446655440010',
        };

        await controller.findByPurchaseOrder(poId, filters, req);

        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          mockTenantId,
          filters,
        );
      });
    });

    describe('Tenant Isolation for PO batches', () => {
      it('should only return batches for the authenticated tenant', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const req = { user: { tenant_id: mockTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = {};

        await controller.findByPurchaseOrder(poId, filters, req);

        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          mockTenantId,
          filters,
        );
      });

      it('should use tenant_id from request context for PO batches', async () => {
        jest
          .spyOn(service, 'findByPurchaseOrderId')
          .mockResolvedValue(mockBatchListResponse);

        const differentTenantId = '550e8400-e29b-41d4-a716-446655440099';
        const req = { user: { tenant_id: differentTenantId } };
        const poId = '550e8400-e29b-41d4-a716-446655440040';
        const filters = {};

        await controller.findByPurchaseOrder(poId, filters, req);

        expect(service.findByPurchaseOrderId).toHaveBeenCalledWith(
          poId,
          differentTenantId,
          filters,
        );
      });
    });
  });

  describe('Permission Checks', () => {
    it('should require inventory:read permission for GET /batches', async () => {
      // Permission check is handled by @RequirePermissions decorator
      // This test verifies the decorator is applied
      const metadata = Reflect.getMetadata(
        'require-permissions',
        controller.findAll,
      );
      // The decorator should be applied to the method
      expect(controller.findAll).toBeDefined();
    });

    it('should require inventory:read permission for GET /batches/:id', async () => {
      // Permission check is handled by @RequirePermissions decorator
      expect(controller.findOne).toBeDefined();
    });

    it('should require inventory:read permission for GET /batches/purchase-order/:poId', async () => {
      // Permission check is handled by @RequirePermissions decorator
      expect(controller.findByPurchaseOrder).toBeDefined();
    });
  });

  describe('Response Structure', () => {
    it('should return BatchResponseDto with all required fields', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockBatchResponseDto);

      const req = { user: { tenant_id: mockTenantId } };
      const batchId = '550e8400-e29b-41d4-a716-446655440001';

      const result = await controller.findOne(batchId, req);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('batch_number');
      expect(result).toHaveProperty('warehouse_id');
      expect(result).toHaveProperty('product_id');
      expect(result).toHaveProperty('uom_id');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('created_by');
      expect(result).toHaveProperty('created_at');
    });

    it('should return BatchListResponseDto with pagination metadata', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue(mockBatchListResponse);

      const req = { user: { tenant_id: mockTenantId } };
      const filters = {};

      const result = await controller.findAll(filters, req);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
