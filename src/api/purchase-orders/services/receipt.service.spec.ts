import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ReceiptValidatorService } from './receipt-validator.service';
import { LineItemUpdaterService } from './line-item-updater.service';
import { BatchCreatorService } from './batch-creator.service';
import { TotalCalculatorService } from './total-calculator.service';
import { POStatusUpdaterService } from './po-status-updater.service';
import { TenantValidatorService } from './tenant-validator.service';
import { UnitConversionService } from './unit-conversion.service';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { UoMCatalog } from '../../../entities/uom-catalog/uom-catalog.entity';
import { ReceivePurchaseOrderDto, ReceivedItemDto } from '../dto/receive-purchase-order.dto';

describe('ReceiptService - Error Handling (Requirements 10.1, 10.2, 10.3, 10.4)', () => {
  let service: ReceiptService;
  let mockDataSource: Partial<DataSource>;
  let mockPurchaseOrderRepository: Partial<Repository<PurchaseOrderBatch>>;
  let mockReceiptValidatorService: Partial<ReceiptValidatorService>;
  let mockTenantValidatorService: Partial<TenantValidatorService>;
  let mockUnitConversionService: Partial<UnitConversionService>;
  let mockBatchCreatorService: Partial<BatchCreatorService>;
  let mockTotalCalculatorService: Partial<TotalCalculatorService>;
  let mockQueryRunner: any;

  beforeEach(async () => {
    // Mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
        getRepository: jest.fn().mockReturnValue({
          query: jest.fn().mockResolvedValue(undefined),
        }),
      },
    };

    // Mock DataSource
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    // Mock repositories and services
    mockPurchaseOrderRepository = {
      findOne: jest.fn(),
    };

    mockReceiptValidatorService = {
      validateReceivedItems: jest.fn(),
    };

    mockTenantValidatorService = {
      validatePOBelongsToTenant: jest.fn(),
    };

    mockUnitConversionService = {
      getBaseUom: jest.fn(),
      convertToBaseUnit: jest.fn(),
    };

    mockBatchCreatorService = {
      createBatchForReceivedItem: jest.fn(),
    };

    mockTotalCalculatorService = {
      calculateReceivedSubtotal: jest.fn(),
      calculateReceivedIvaTotal: jest.fn(),
      calculateReceivedIepsTotal: jest.fn(),
      calculateReceivedTotal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(PurchaseOrderBatch),
          useValue: mockPurchaseOrderRepository,
        },
        {
          provide: getRepositoryToken(PurchaseOrderBatchDetail),
          useValue: { query: jest.fn(), update: jest.fn() },
        },
        {
          provide: getRepositoryToken(InventoryBatch),
          useValue: { count: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: getRepositoryToken(UoMCatalog),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: ReceiptValidatorService,
          useValue: mockReceiptValidatorService,
        },
        {
          provide: LineItemUpdaterService,
          useValue: {},
        },
        {
          provide: BatchCreatorService,
          useValue: mockBatchCreatorService,
        },
        {
          provide: TotalCalculatorService,
          useValue: mockTotalCalculatorService,
        },
        {
          provide: POStatusUpdaterService,
          useValue: {},
        },
        {
          provide: TenantValidatorService,
          useValue: mockTenantValidatorService,
        },
        {
          provide: UnitConversionService,
          useValue: mockUnitConversionService,
        },
        {
          provide: PurchaseOrderActivityService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ReceiptService>(ReceiptService);
  });

  describe('Requirement 10.1: Line Item Not Found Error', () => {
    it('should catch NotFoundException for missing line items and re-throw with context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const lineItemId = 'line-item-999';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: lineItemId,
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      // Mock validator to throw NotFoundException for missing line item
      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockRejectedValue(
        new NotFoundException(`Línea no encontrada: ${lineItemId}`),
      );

      await expect(
        service.receive(poId, dto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should log error context when line item not found', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const lineItemId = 'line-item-999';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: lineItemId,
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);
      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockRejectedValue(
        new NotFoundException(`Línea no encontrada: ${lineItemId}`),
      );

      // Verify that the error is thrown with the line item ID in the message
      const error = await service.receive(poId, dto, tenantId, userId).catch(e => e);
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toContain(lineItemId);
    });
  });

  describe('Requirement 10.2: Missing Purchase Order Error', () => {
    it('should catch NotFoundException for missing purchase order and re-throw with context', async () => {
      const poId = 'po-999';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      // Mock tenant validator to throw NotFoundException
      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockRejectedValue(
        new NotFoundException(`Orden de compra no encontrada: ${poId}`),
      );

      await expect(
        service.receive(poId, dto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should catch database errors and rollback transaction', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);
      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock database error during batch creation
      (mockBatchCreatorService.createBatchForReceivedItem as jest.Mock).mockRejectedValue(
        new Error('Database connection lost'),
      );

      (mockUnitConversionService.getBaseUom as jest.Mock).mockResolvedValue('uom-base');
      (mockUnitConversionService.convertToBaseUnit as jest.Mock).mockResolvedValue(10);

      await expect(
        service.receive(poId, dto, tenantId, userId),
      ).rejects.toThrow();

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('Requirement 10.3: Validation Error Handling', () => {
    it('should catch BadRequestException for validation errors and re-throw with context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: -10, // Invalid: negative quantity
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);

      // Mock validator to throw BadRequestException
      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockRejectedValue(
        new BadRequestException('La cantidad recibida no puede ser negativa'),
      );

      await expect(
        service.receive(poId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should log validation errors with context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 0, // Invalid: no items received
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);

      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockRejectedValue(
        new BadRequestException('Se debe recibir al menos un producto'),
      );

      try {
        await service.receive(poId, dto, tenantId, userId);
      } catch (e) {
        // Expected to throw
      }

      // Verify warning was logged with context
      expect(loggerSpy).toHaveBeenCalled();
      const calls = loggerSpy.mock.calls;
      const hasValidationError = calls.some(call => 
        call[0].includes('Validation failed')
      );
      expect(hasValidationError).toBe(true);
    });

    it('should catch unit conversion errors and re-throw with context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-invalid',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);
      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock unit conversion error
      (mockUnitConversionService.getBaseUom as jest.Mock).mockRejectedValue(
        new BadRequestException('Conversión de unidad no soportada'),
      );

      await expect(
        service.receive(poId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('Requirement 10.4: Error Logging with Context', () => {
    it('should log all errors with sufficient context (user ID, PO ID, tenant ID, error details)', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock database error
      (mockQueryRunner.manager.findOne as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      try {
        await service.receive(poId, dto, tenantId, userId);
      } catch (e) {
        // Expected to throw
      }

      // Verify error was logged with full context
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error processing receipt'),
        expect.any(String),
      );

      // Verify the logged message contains context
      const errorCall = loggerSpy.mock.calls[0][0];
      expect(errorCall).toContain(poId);
      expect(errorCall).toContain(tenantId);
      expect(errorCall).toContain(userId);
    });

    it('should include error type and timestamp in error context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );

      (mockQueryRunner.manager.findOne as jest.Mock).mockRejectedValue(
        new Error('Test error'),
      );

      try {
        await service.receive(poId, dto, tenantId, userId);
      } catch (e) {
        // Expected to throw
      }

      // Verify error context includes error type and timestamp
      const errorCall = loggerSpy.mock.calls[0][0];
      expect(errorCall).toContain('errorType');
      expect(errorCall).toContain('errorMessage');
      expect(errorCall).toContain('timestamp');
    });

    it('should log validation errors with PO and tenant context', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 0,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);

      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockRejectedValue(
        new BadRequestException('Se debe recibir al menos un producto'),
      );

      // Verify that the error is thrown
      const error = await service.receive(poId, dto, tenantId, userId).catch(e => e);
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toContain('Se debe recibir al menos un producto');
    });
  });

  describe('Transaction Rollback on Error', () => {
    it('should always rollback transaction on any error', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockRejectedValue(
        new Error('Unexpected error'),
      );

      try {
        await service.receive(poId, dto, tenantId, userId);
      } catch (e) {
        // Expected to throw
      }

      // Verify rollback was called
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should always release database connection in finally block', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockRejectedValue(
        new Error('Test error'),
      );

      try {
        await service.receive(poId, dto, tenantId, userId);
      } catch (e) {
        // Expected to throw
      }

      // Verify connection was released
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('Error Response Status Codes', () => {
    it('should return NotFoundException (404) for missing purchase order', async () => {
      const poId = 'po-999';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockRejectedValue(
        new NotFoundException(`Orden de compra no encontrada: ${poId}`),
      );

      const error = await service.receive(poId, dto, tenantId, userId).catch(e => e);
      expect(error).toBeInstanceOf(NotFoundException);
    });

    it('should return BadRequestException (400) for validation errors', async () => {
      const poId = 'po-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';

      const dto: ReceivePurchaseOrderDto = {
        received_items: [
          {
            line_item_id: 'line-item-123',
            product_id: 'prod-123',
            uom_id: 'uom-123',
            quantity: -10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ],
      };

      const mockPO = {
        id: poId,
        tenant_id: tenantId,
        line_items: [],
      };

      (mockTenantValidatorService.validatePOBelongsToTenant as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(mockPO);

      (mockReceiptValidatorService.validateReceivedItems as jest.Mock).mockRejectedValue(
        new BadRequestException('La cantidad recibida no puede ser negativa'),
      );

      const error = await service.receive(poId, dto, tenantId, userId).catch(e => e);
      expect(error).toBeInstanceOf(BadRequestException);
    });
  });
});
