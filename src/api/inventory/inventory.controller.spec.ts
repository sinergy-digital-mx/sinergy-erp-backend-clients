import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemDto } from './dto/query-inventory-item.dto';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { QueryInventoryMovementDto } from './dto/query-inventory-movement.dto';
import { CreateStockReservationDto } from './dto/create-stock-reservation.dto';
import { QueryStockReservationDto } from './dto/query-stock-reservation.dto';
import { TransferInventoryDto } from './dto/transfer-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: InventoryService;

  const mockInventoryService = {
    createInventoryItem: jest.fn(),
    findInventoryItems: jest.fn(),
    findInventoryItemById: jest.fn(),
    updateInventoryItem: jest.fn(),
    deleteInventoryItem: jest.fn(),
    createInventoryMovement: jest.fn(),
    findInventoryMovements: jest.fn(),
    findInventoryMovementById: jest.fn(),
    createStockReservation: jest.fn(),
    fulfillStockReservation: jest.fn(),
    cancelStockReservation: jest.fn(),
    findStockReservations: jest.fn(),
    transferInventory: jest.fn(),
    adjustInventory: jest.fn(),
    getLowStockItems: jest.fn(),
    getInventoryValuationReport: jest.fn(),
    getStockByProduct: jest.fn(),
    getStockByWarehouse: jest.fn(),
  };

  const mockRequest = {
    user: {
      tenantId: 'tenant-123',
      userId: 'user-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Inventory Items Endpoints', () => {
    describe('createInventoryItem', () => {
      it('should create an inventory item', async () => {
        const dto: CreateInventoryItemDto = {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          uom_id: 'uom-1',
          quantity_on_hand: 100,
          unit_cost: 10,
        };

        const expectedResult = {
          id: 'item-1',
          ...dto,
          tenant_id: 'tenant-123',
        };

        mockInventoryService.createInventoryItem.mockResolvedValue(expectedResult);

        const result = await controller.createInventoryItem(dto, mockRequest);

        expect(service.createInventoryItem).toHaveBeenCalledWith(dto, 'tenant-123');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('findInventoryItems', () => {
      it('should return paginated inventory items', async () => {
        const query: QueryInventoryItemDto = {
          page: 1,
          limit: 20,
        };

        const expectedResult = {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };

        mockInventoryService.findInventoryItems.mockResolvedValue(expectedResult);

        const result = await controller.findInventoryItems(query, mockRequest);

        expect(service.findInventoryItems).toHaveBeenCalledWith('tenant-123', query);
        expect(result).toEqual(expectedResult);
      });

      it('should apply filters correctly', async () => {
        const query: QueryInventoryItemDto = {
          page: 1,
          limit: 20,
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          low_stock: true,
        };

        mockInventoryService.findInventoryItems.mockResolvedValue({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });

        await controller.findInventoryItems(query, mockRequest);

        expect(service.findInventoryItems).toHaveBeenCalledWith('tenant-123', query);
      });
    });

    describe('findInventoryItemById', () => {
      it('should return a specific inventory item', async () => {
        const itemId = 'item-1';
        const expectedResult = {
          id: itemId,
          tenant_id: 'tenant-123',
          product_id: 'product-1',
        };

        mockInventoryService.findInventoryItemById.mockResolvedValue(expectedResult);

        const result = await controller.findInventoryItemById(itemId, mockRequest);

        expect(service.findInventoryItemById).toHaveBeenCalledWith(itemId, 'tenant-123');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('updateInventoryItem', () => {
      it('should update an inventory item', async () => {
        const itemId = 'item-1';
        const dto: UpdateInventoryItemDto = {
          reorder_point: 20,
          reorder_quantity: 50,
        };

        const expectedResult = {
          id: itemId,
          ...dto,
        };

        mockInventoryService.updateInventoryItem.mockResolvedValue(expectedResult);

        const result = await controller.updateInventoryItem(itemId, dto, mockRequest);

        expect(service.updateInventoryItem).toHaveBeenCalledWith(itemId, dto, 'tenant-123');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('deleteInventoryItem', () => {
      it('should delete an inventory item', async () => {
        const itemId = 'item-1';

        mockInventoryService.deleteInventoryItem.mockResolvedValue(undefined);

        await controller.deleteInventoryItem(itemId, mockRequest);

        expect(service.deleteInventoryItem).toHaveBeenCalledWith(itemId, 'tenant-123');
      });
    });
  });

  describe('Inventory Movements Endpoints', () => {
    describe('createInventoryMovement', () => {
      it('should create an inventory movement', async () => {
        const dto: CreateInventoryMovementDto = {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          uom_id: 'uom-1',
          movement_type: 'purchase_receipt',
          quantity: 100,
          unit_cost: 10,
        };

        const expectedResult = {
          id: 'movement-1',
          ...dto,
          tenant_id: 'tenant-123',
        };

        mockInventoryService.createInventoryMovement.mockResolvedValue(expectedResult);

        const result = await controller.createInventoryMovement(dto, mockRequest);

        expect(service.createInventoryMovement).toHaveBeenCalledWith(
          dto,
          'tenant-123',
          'user-123',
        );
        expect(result).toEqual(expectedResult);
      });
    });

    describe('findInventoryMovements', () => {
      it('should return paginated inventory movements', async () => {
        const query: QueryInventoryMovementDto = {
          page: 1,
          limit: 20,
        };

        const expectedResult = {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };

        mockInventoryService.findInventoryMovements.mockResolvedValue(expectedResult);

        const result = await controller.findInventoryMovements(query, mockRequest);

        expect(service.findInventoryMovements).toHaveBeenCalledWith('tenant-123', query);
        expect(result).toEqual(expectedResult);
      });

      it('should apply filters correctly', async () => {
        const query: QueryInventoryMovementDto = {
          page: 1,
          limit: 20,
          product_id: 'product-1',
          movement_type: 'purchase_receipt',
          movement_date_from: '2024-01-01',
        };

        mockInventoryService.findInventoryMovements.mockResolvedValue({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });

        await controller.findInventoryMovements(query, mockRequest);

        expect(service.findInventoryMovements).toHaveBeenCalledWith('tenant-123', query);
      });
    });

    describe('findInventoryMovementById', () => {
      it('should return a specific inventory movement', async () => {
        const movementId = 'movement-1';
        const expectedResult = {
          id: movementId,
          tenant_id: 'tenant-123',
        };

        mockInventoryService.findInventoryMovementById.mockResolvedValue(expectedResult);

        const result = await controller.findInventoryMovementById(movementId, mockRequest);

        expect(service.findInventoryMovementById).toHaveBeenCalledWith(
          movementId,
          'tenant-123',
        );
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('Stock Reservations Endpoints', () => {
    describe('createStockReservation', () => {
      it('should create a stock reservation', async () => {
        const dto: CreateStockReservationDto = {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          uom_id: 'uom-1',
          quantity_reserved: 10,
          reference_type: 'sales_order',
          reference_id: 'order-1',
        };

        const expectedResult = {
          id: 'reservation-1',
          ...dto,
          tenant_id: 'tenant-123',
          status: 'active',
        };

        mockInventoryService.createStockReservation.mockResolvedValue(expectedResult);

        const result = await controller.createStockReservation(dto, mockRequest);

        expect(service.createStockReservation).toHaveBeenCalledWith(dto, 'tenant-123');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('fulfillStockReservation', () => {
      it('should fulfill a stock reservation', async () => {
        const reservationId = 'reservation-1';

        mockInventoryService.fulfillStockReservation.mockResolvedValue(undefined);

        await controller.fulfillStockReservation(reservationId, mockRequest);

        expect(service.fulfillStockReservation).toHaveBeenCalledWith(
          reservationId,
          'tenant-123',
          'user-123',
        );
      });
    });

    describe('cancelStockReservation', () => {
      it('should cancel a stock reservation', async () => {
        const reservationId = 'reservation-1';

        mockInventoryService.cancelStockReservation.mockResolvedValue(undefined);

        await controller.cancelStockReservation(reservationId, mockRequest);

        expect(service.cancelStockReservation).toHaveBeenCalledWith(
          reservationId,
          'tenant-123',
        );
      });
    });

    describe('findStockReservations', () => {
      it('should return paginated stock reservations', async () => {
        const query: QueryStockReservationDto = {
          page: 1,
          limit: 20,
        };

        const expectedResult = {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        };

        mockInventoryService.findStockReservations.mockResolvedValue(expectedResult);

        const result = await controller.findStockReservations(query, mockRequest);

        expect(service.findStockReservations).toHaveBeenCalledWith('tenant-123', query);
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('Transfers and Adjustments Endpoints', () => {
    describe('transferInventory', () => {
      it('should transfer inventory between warehouses', async () => {
        const dto: TransferInventoryDto = {
          product_id: 'product-1',
          source_warehouse_id: 'warehouse-1',
          destination_warehouse_id: 'warehouse-2',
          uom_id: 'uom-1',
          quantity: 50,
          unit_cost: 10,
        };

        const expectedResult = {
          outMovement: { id: 'movement-out' },
          inMovement: { id: 'movement-in' },
        };

        mockInventoryService.transferInventory.mockResolvedValue(expectedResult);

        const result = await controller.transferInventory(dto, mockRequest);

        expect(service.transferInventory).toHaveBeenCalledWith(
          dto,
          'tenant-123',
          'user-123',
        );
        expect(result).toEqual(expectedResult);
      });
    });

    describe('adjustInventory', () => {
      it('should adjust inventory quantity', async () => {
        const dto: AdjustInventoryDto = {
          product_id: 'product-1',
          warehouse_id: 'warehouse-1',
          uom_id: 'uom-1',
          quantity: 10,
          unit_cost: 10,
          notes: 'Physical count adjustment',
        };

        const expectedResult = {
          id: 'movement-1',
          ...dto,
          movement_type: 'adjustment',
        };

        mockInventoryService.adjustInventory.mockResolvedValue(expectedResult);

        const result = await controller.adjustInventory(dto, mockRequest);

        expect(service.adjustInventory).toHaveBeenCalledWith(
          dto,
          'tenant-123',
          'user-123',
        );
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('Reports Endpoints', () => {
    describe('getLowStockItems', () => {
      it('should return low stock items', async () => {
        const expectedResult = [
          {
            id: 'item-1',
            quantity_available: 5,
            reorder_point: 10,
          },
        ];

        mockInventoryService.getLowStockItems.mockResolvedValue(expectedResult);

        const result = await controller.getLowStockItems(mockRequest);

        expect(service.getLowStockItems).toHaveBeenCalledWith('tenant-123');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getInventoryValuationReport', () => {
      it('should return inventory valuation report', async () => {
        const expectedResult = {
          items: [],
          summary: {
            total_value: 0,
            by_warehouse: [],
          },
        };

        mockInventoryService.getInventoryValuationReport.mockResolvedValue(expectedResult);

        const result = await controller.getInventoryValuationReport('' as any, mockRequest);

        expect(service.getInventoryValuationReport).toHaveBeenCalledWith(
          'tenant-123',
          '',
        );
        expect(result).toEqual(expectedResult);
      });

      it('should filter by warehouse when provided', async () => {
        const warehouseId = 'warehouse-1';
        const expectedResult = {
          items: [],
          summary: {
            total_value: 0,
            by_warehouse: [],
          },
        };

        mockInventoryService.getInventoryValuationReport.mockResolvedValue(expectedResult);

        const result = await controller.getInventoryValuationReport(
          warehouseId,
          mockRequest,
        );

        expect(service.getInventoryValuationReport).toHaveBeenCalledWith(
          'tenant-123',
          warehouseId,
        );
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getStockByProduct', () => {
      it('should return stock by product', async () => {
        const productId = 'product-1';
        const expectedResult = [
          {
            id: 'item-1',
            product_id: productId,
            warehouse_id: 'warehouse-1',
          },
        ];

        mockInventoryService.getStockByProduct.mockResolvedValue(expectedResult);

        const result = await controller.getStockByProduct(productId, mockRequest);

        expect(service.getStockByProduct).toHaveBeenCalledWith(productId, 'tenant-123');
        expect(result).toEqual(expectedResult);
      });
    });

    describe('getStockByWarehouse', () => {
      it('should return stock by warehouse', async () => {
        const warehouseId = 'warehouse-1';
        const expectedResult = [
          {
            id: 'item-1',
            product_id: 'product-1',
            warehouse_id: warehouseId,
          },
        ];

        mockInventoryService.getStockByWarehouse.mockResolvedValue(expectedResult);

        const result = await controller.getStockByWarehouse(warehouseId, mockRequest);

        expect(service.getStockByWarehouse).toHaveBeenCalledWith(
          warehouseId,
          'tenant-123',
        );
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('Request Context Extraction', () => {
    it('should extract tenantId from request correctly', async () => {
      const dto: CreateInventoryItemDto = {
        product_id: 'product-1',
        warehouse_id: 'warehouse-1',
        uom_id: 'uom-1',
      };

      mockInventoryService.createInventoryItem.mockResolvedValue({});

      await controller.createInventoryItem(dto, mockRequest);

      expect(service.createInventoryItem).toHaveBeenCalledWith(
        dto,
        'tenant-123',
      );
    });

    it('should extract userId from request correctly', async () => {
      const dto: CreateInventoryMovementDto = {
        product_id: 'product-1',
        warehouse_id: 'warehouse-1',
        uom_id: 'uom-1',
        movement_type: 'adjustment',
        quantity: 10,
        unit_cost: 10,
      };

      mockInventoryService.createInventoryMovement.mockResolvedValue({});

      await controller.createInventoryMovement(dto, mockRequest);

      expect(service.createInventoryMovement).toHaveBeenCalledWith(
        dto,
        'tenant-123',
        'user-123',
      );
    });
  });
});
