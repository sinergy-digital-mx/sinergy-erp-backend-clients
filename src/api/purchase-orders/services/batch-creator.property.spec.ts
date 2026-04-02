import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { BatchCreatorService } from './batch-creator.service';
import { BatchNumberGeneratorService } from './batch-number-generator.service';
import { UnitConversionService } from './unit-conversion.service';
import { InventoryBatch } from '../../../entities/purchase-orders/inventory-batch.entity';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

/**
 * Property-Based Tests for BatchCreatorService
 * **Validates: Requirements 3.1 through 3.13, 11.3**
 */
describe('BatchCreatorService - Property-Based Tests', () => {
  describe('Property 4: Batch Created for Each Received Item', () => {
    it('should create exactly one batch for each received item', async () => {
      // **Validates: Requirements 3.1**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poId: fc.uuid(),
            tenantId: fc.uuid(),
            warehouseId: fc.uuid(),
            lineItemId: fc.uuid(),
            productId: fc.uuid(),
            userId: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            uomId: fc.uuid(),
            baseUomId: fc.uuid(),
          }),
          async (scenario) => {
            const module: TestingModule = await Test.createTestingModule({
              providers: [
                BatchCreatorService,
                {
                  provide: getRepositoryToken(InventoryBatch),
                  useValue: {
                    create: jest.fn(),
                    save: jest.fn(),
                  },
                },
                {
                  provide: BatchNumberGeneratorService,
                  useValue: {
                    generateBatchNumber: jest.fn(),
                  },
                },
                {
                  provide: UnitConversionService,
                  useValue: {
                    getBaseUom: jest.fn(),
                    convertToBaseUnit: jest.fn(),
                  },
                },
              ],
            }).compile();

            const service = module.get<BatchCreatorService>(BatchCreatorService);
            const inventoryBatchRepository = module.get<Repository<InventoryBatch>>(
              getRepositoryToken(InventoryBatch),
            );
            const batchNumberGeneratorService = module.get<BatchNumberGeneratorService>(
              BatchNumberGeneratorService,
            );
            const unitConversionService = module.get<UnitConversionService>(
              UnitConversionService,
            );

            const mockPurchaseOrder: PurchaseOrderBatch = {
              id: scenario.poId,
              tenant_id: scenario.tenantId,
              warehouse_id: scenario.warehouseId,
              folio: 'ODC-000001',
              general_status: 'Creada',
              received_subtotal: 0,
              received_iva_total: 0,
              received_ieps_total: 0,
              received_total: 0,
              created_by: 'user-1',
              created_at: new Date(),
              updated_by: null,
              updated_at: null,
            } as any;

            const mockReceivedItem: ReceivedItemDto = {
              line_item_id: scenario.lineItemId,
              product_id: scenario.productId,
              uom_id: scenario.uomId,
              quantity: scenario.quantity,
              unit_total: 100,
              iva_percentage: 16,
              iva_unit: 16,
              ieps_percentage: 0,
              ieps_unit: 0,
            };

            const mockBatch: InventoryBatch = {
              id: 'batch-1',
              tenant_id: scenario.tenantId,
              batch_number: 'MH-LOTE-000001',
              warehouse_id: scenario.warehouseId,
              product_id: scenario.productId,
              uom_id: scenario.baseUomId,
              quantity: scenario.quantity,
              purchase_order_batch_id: scenario.poId,
              purchase_order_detail_id: scenario.lineItemId,
              created_by: scenario.userId,
              created_at: new Date(),
            } as any;

            jest
              .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
              .mockResolvedValue('MH-LOTE-000001');
            jest
              .spyOn(unitConversionService, 'getBaseUom')
              .mockResolvedValue(scenario.baseUomId);
            jest
              .spyOn(unitConversionService, 'convertToBaseUnit')
              .mockResolvedValue(scenario.quantity);
            jest
              .spyOn(inventoryBatchRepository, 'create')
              .mockReturnValue(mockBatch);
            jest
              .spyOn(inventoryBatchRepository, 'save')
              .mockResolvedValue(mockBatch);

            const result = await service.createBatchForReceivedItem(
              mockReceivedItem,
              mockPurchaseOrder,
              scenario.lineItemId,
              scenario.userId,
            );

            // Verify exactly one batch was created
            expect(inventoryBatchRepository.create).toHaveBeenCalledTimes(1);
            expect(inventoryBatchRepository.save).toHaveBeenCalledTimes(1);
            expect(result).toBeDefined();
            expect(result.id).toBe('batch-1');
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 7: Batch References Correct Warehouse', () => {
    it('should set warehouse_id from the purchase order', async () => {
      // **Validates: Requirements 3.6**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poId: fc.uuid(),
            tenantId: fc.uuid(),
            warehouseId: fc.uuid(),
            lineItemId: fc.uuid(),
            productId: fc.uuid(),
            userId: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            uomId: fc.uuid(),
            baseUomId: fc.uuid(),
          }),
          async (scenario) => {
            const module: TestingModule = await Test.createTestingModule({
              providers: [
                BatchCreatorService,
                {
                  provide: getRepositoryToken(InventoryBatch),
                  useValue: {
                    create: jest.fn(),
                    save: jest.fn(),
                  },
                },
                {
                  provide: BatchNumberGeneratorService,
                  useValue: {
                    generateBatchNumber: jest.fn(),
                  },
                },
                {
                  provide: UnitConversionService,
                  useValue: {
                    getBaseUom: jest.fn(),
                    convertToBaseUnit: jest.fn(),
                  },
                },
              ],
            }).compile();

            const service = module.get<BatchCreatorService>(BatchCreatorService);
            const inventoryBatchRepository = module.get<Repository<InventoryBatch>>(
              getRepositoryToken(InventoryBatch),
            );
            const batchNumberGeneratorService = module.get<BatchNumberGeneratorService>(
              BatchNumberGeneratorService,
            );
            const unitConversionService = module.get<UnitConversionService>(
              UnitConversionService,
            );

            const mockPurchaseOrder: PurchaseOrderBatch = {
              id: scenario.poId,
              tenant_id: scenario.tenantId,
              warehouse_id: scenario.warehouseId,
              folio: 'ODC-000001',
              general_status: 'Creada',
              received_subtotal: 0,
              received_iva_total: 0,
              received_ieps_total: 0,
              received_total: 0,
              created_by: 'user-1',
              created_at: new Date(),
              updated_by: null,
              updated_at: null,
            } as any;

            const mockReceivedItem: ReceivedItemDto = {
              line_item_id: scenario.lineItemId,
              product_id: scenario.productId,
              uom_id: scenario.uomId,
              quantity: scenario.quantity,
              unit_total: 100,
              iva_percentage: 16,
              iva_unit: 16,
              ieps_percentage: 0,
              ieps_unit: 0,
            };

            const mockBatch: InventoryBatch = {
              id: 'batch-1',
              tenant_id: scenario.tenantId,
              batch_number: 'MH-LOTE-000001',
              warehouse_id: scenario.warehouseId,
              product_id: scenario.productId,
              uom_id: scenario.baseUomId,
              quantity: scenario.quantity,
              purchase_order_batch_id: scenario.poId,
              purchase_order_detail_id: scenario.lineItemId,
              created_by: scenario.userId,
              created_at: new Date(),
            } as any;

            jest
              .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
              .mockResolvedValue('MH-LOTE-000001');
            jest
              .spyOn(unitConversionService, 'getBaseUom')
              .mockResolvedValue(scenario.baseUomId);
            jest
              .spyOn(unitConversionService, 'convertToBaseUnit')
              .mockResolvedValue(scenario.quantity);
            jest
              .spyOn(inventoryBatchRepository, 'create')
              .mockReturnValue(mockBatch);
            jest
              .spyOn(inventoryBatchRepository, 'save')
              .mockResolvedValue(mockBatch);

            const result = await service.createBatchForReceivedItem(
              mockReceivedItem,
              mockPurchaseOrder,
              scenario.lineItemId,
              scenario.userId,
            );

            // Verify warehouse_id matches PO
            expect(result.warehouse_id).toBe(scenario.warehouseId);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 8: Batch References Correct Product', () => {
    it('should set product_id from the received item', async () => {
      // **Validates: Requirements 3.7**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poId: fc.uuid(),
            tenantId: fc.uuid(),
            warehouseId: fc.uuid(),
            lineItemId: fc.uuid(),
            productId: fc.uuid(),
            userId: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            uomId: fc.uuid(),
            baseUomId: fc.uuid(),
          }),
          async (scenario) => {
            const module: TestingModule = await Test.createTestingModule({
              providers: [
                BatchCreatorService,
                {
                  provide: getRepositoryToken(InventoryBatch),
                  useValue: {
                    create: jest.fn(),
                    save: jest.fn(),
                  },
                },
                {
                  provide: BatchNumberGeneratorService,
                  useValue: {
                    generateBatchNumber: jest.fn(),
                  },
                },
                {
                  provide: UnitConversionService,
                  useValue: {
                    getBaseUom: jest.fn(),
                    convertToBaseUnit: jest.fn(),
                  },
                },
              ],
            }).compile();

            const service = module.get<BatchCreatorService>(BatchCreatorService);
            const inventoryBatchRepository = module.get<Repository<InventoryBatch>>(
              getRepositoryToken(InventoryBatch),
            );
            const batchNumberGeneratorService = module.get<BatchNumberGeneratorService>(
              BatchNumberGeneratorService,
            );
            const unitConversionService = module.get<UnitConversionService>(
              UnitConversionService,
            );

            const mockPurchaseOrder: PurchaseOrderBatch = {
              id: scenario.poId,
              tenant_id: scenario.tenantId,
              warehouse_id: scenario.warehouseId,
              folio: 'ODC-000001',
              general_status: 'Creada',
              received_subtotal: 0,
              received_iva_total: 0,
              received_ieps_total: 0,
              received_total: 0,
              created_by: 'user-1',
              created_at: new Date(),
              updated_by: null,
              updated_at: null,
            } as any;

            const mockReceivedItem: ReceivedItemDto = {
              line_item_id: scenario.lineItemId,
              product_id: scenario.productId,
              uom_id: scenario.uomId,
              quantity: scenario.quantity,
              unit_total: 100,
              iva_percentage: 16,
              iva_unit: 16,
              ieps_percentage: 0,
              ieps_unit: 0,
            };

            const mockBatch: InventoryBatch = {
              id: 'batch-1',
              tenant_id: scenario.tenantId,
              batch_number: 'MH-LOTE-000001',
              warehouse_id: scenario.warehouseId,
              product_id: scenario.productId,
              uom_id: scenario.baseUomId,
              quantity: scenario.quantity,
              purchase_order_batch_id: scenario.poId,
              purchase_order_detail_id: scenario.lineItemId,
              created_by: scenario.userId,
              created_at: new Date(),
            } as any;

            jest
              .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
              .mockResolvedValue('MH-LOTE-000001');
            jest
              .spyOn(unitConversionService, 'getBaseUom')
              .mockResolvedValue(scenario.baseUomId);
            jest
              .spyOn(unitConversionService, 'convertToBaseUnit')
              .mockResolvedValue(scenario.quantity);
            jest
              .spyOn(inventoryBatchRepository, 'create')
              .mockReturnValue(mockBatch);
            jest
              .spyOn(inventoryBatchRepository, 'save')
              .mockResolvedValue(mockBatch);

            const result = await service.createBatchForReceivedItem(
              mockReceivedItem,
              mockPurchaseOrder,
              scenario.lineItemId,
              scenario.userId,
            );

            // Verify product_id matches received item
            expect(result.product_id).toBe(scenario.productId);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 10: Batch References Correct PO and Line Item', () => {
    it('should set purchase_order_batch_id and purchase_order_detail_id references', async () => {
      // **Validates: Requirements 3.10, 3.11**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poId: fc.uuid(),
            tenantId: fc.uuid(),
            warehouseId: fc.uuid(),
            lineItemId: fc.uuid(),
            productId: fc.uuid(),
            userId: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            uomId: fc.uuid(),
            baseUomId: fc.uuid(),
          }),
          async (scenario) => {
            const module: TestingModule = await Test.createTestingModule({
              providers: [
                BatchCreatorService,
                {
                  provide: getRepositoryToken(InventoryBatch),
                  useValue: {
                    create: jest.fn(),
                    save: jest.fn(),
                  },
                },
                {
                  provide: BatchNumberGeneratorService,
                  useValue: {
                    generateBatchNumber: jest.fn(),
                  },
                },
                {
                  provide: UnitConversionService,
                  useValue: {
                    getBaseUom: jest.fn(),
                    convertToBaseUnit: jest.fn(),
                  },
                },
              ],
            }).compile();

            const service = module.get<BatchCreatorService>(BatchCreatorService);
            const inventoryBatchRepository = module.get<Repository<InventoryBatch>>(
              getRepositoryToken(InventoryBatch),
            );
            const batchNumberGeneratorService = module.get<BatchNumberGeneratorService>(
              BatchNumberGeneratorService,
            );
            const unitConversionService = module.get<UnitConversionService>(
              UnitConversionService,
            );

            const mockPurchaseOrder: PurchaseOrderBatch = {
              id: scenario.poId,
              tenant_id: scenario.tenantId,
              warehouse_id: scenario.warehouseId,
              folio: 'ODC-000001',
              general_status: 'Creada',
              received_subtotal: 0,
              received_iva_total: 0,
              received_ieps_total: 0,
              received_total: 0,
              created_by: 'user-1',
              created_at: new Date(),
              updated_by: null,
              updated_at: null,
            } as any;

            const mockReceivedItem: ReceivedItemDto = {
              line_item_id: scenario.lineItemId,
              product_id: scenario.productId,
              uom_id: scenario.uomId,
              quantity: scenario.quantity,
              unit_total: 100,
              iva_percentage: 16,
              iva_unit: 16,
              ieps_percentage: 0,
              ieps_unit: 0,
            };

            const mockBatch: InventoryBatch = {
              id: 'batch-1',
              tenant_id: scenario.tenantId,
              batch_number: 'MH-LOTE-000001',
              warehouse_id: scenario.warehouseId,
              product_id: scenario.productId,
              uom_id: scenario.baseUomId,
              quantity: scenario.quantity,
              purchase_order_batch_id: scenario.poId,
              purchase_order_detail_id: scenario.lineItemId,
              created_by: scenario.userId,
              created_at: new Date(),
            } as any;

            jest
              .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
              .mockResolvedValue('MH-LOTE-000001');
            jest
              .spyOn(unitConversionService, 'getBaseUom')
              .mockResolvedValue(scenario.baseUomId);
            jest
              .spyOn(unitConversionService, 'convertToBaseUnit')
              .mockResolvedValue(scenario.quantity);
            jest
              .spyOn(inventoryBatchRepository, 'create')
              .mockReturnValue(mockBatch);
            jest
              .spyOn(inventoryBatchRepository, 'save')
              .mockResolvedValue(mockBatch);

            const result = await service.createBatchForReceivedItem(
              mockReceivedItem,
              mockPurchaseOrder,
              scenario.lineItemId,
              scenario.userId,
            );

            // Verify references
            expect(result.purchase_order_batch_id).toBe(scenario.poId);
            expect(result.purchase_order_detail_id).toBe(scenario.lineItemId);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 11: Batch Audit Fields Set Correctly', () => {
    it('should set created_by and created_at with current user and timestamp', async () => {
      // **Validates: Requirements 3.12, 3.13**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            poId: fc.uuid(),
            tenantId: fc.uuid(),
            warehouseId: fc.uuid(),
            lineItemId: fc.uuid(),
            productId: fc.uuid(),
            userId: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            uomId: fc.uuid(),
            baseUomId: fc.uuid(),
          }),
          async (scenario) => {
            const module: TestingModule = await Test.createTestingModule({
              providers: [
                BatchCreatorService,
                {
                  provide: getRepositoryToken(InventoryBatch),
                  useValue: {
                    create: jest.fn(),
                    save: jest.fn(),
                  },
                },
                {
                  provide: BatchNumberGeneratorService,
                  useValue: {
                    generateBatchNumber: jest.fn(),
                  },
                },
                {
                  provide: UnitConversionService,
                  useValue: {
                    getBaseUom: jest.fn(),
                    convertToBaseUnit: jest.fn(),
                  },
                },
              ],
            }).compile();

            const service = module.get<BatchCreatorService>(BatchCreatorService);
            const inventoryBatchRepository = module.get<Repository<InventoryBatch>>(
              getRepositoryToken(InventoryBatch),
            );
            const batchNumberGeneratorService = module.get<BatchNumberGeneratorService>(
              BatchNumberGeneratorService,
            );
            const unitConversionService = module.get<UnitConversionService>(
              UnitConversionService,
            );

            const mockPurchaseOrder: PurchaseOrderBatch = {
              id: scenario.poId,
              tenant_id: scenario.tenantId,
              warehouse_id: scenario.warehouseId,
              folio: 'ODC-000001',
              general_status: 'Creada',
              received_subtotal: 0,
              received_iva_total: 0,
              received_ieps_total: 0,
              received_total: 0,
              created_by: 'user-1',
              created_at: new Date(),
              updated_by: null,
              updated_at: null,
            } as any;

            const mockReceivedItem: ReceivedItemDto = {
              line_item_id: scenario.lineItemId,
              product_id: scenario.productId,
              uom_id: scenario.uomId,
              quantity: scenario.quantity,
              unit_total: 100,
              iva_percentage: 16,
              iva_unit: 16,
              ieps_percentage: 0,
              ieps_unit: 0,
            };

            const mockBatch: InventoryBatch = {
              id: 'batch-1',
              tenant_id: scenario.tenantId,
              batch_number: 'MH-LOTE-000001',
              warehouse_id: scenario.warehouseId,
              product_id: scenario.productId,
              uom_id: scenario.baseUomId,
              quantity: scenario.quantity,
              purchase_order_batch_id: scenario.poId,
              purchase_order_detail_id: scenario.lineItemId,
              created_by: scenario.userId,
              created_at: new Date(),
            } as any;

            jest
              .spyOn(batchNumberGeneratorService, 'generateBatchNumber')
              .mockResolvedValue('MH-LOTE-000001');
            jest
              .spyOn(unitConversionService, 'getBaseUom')
              .mockResolvedValue(scenario.baseUomId);
            jest
              .spyOn(unitConversionService, 'convertToBaseUnit')
              .mockResolvedValue(scenario.quantity);
            jest
              .spyOn(inventoryBatchRepository, 'create')
              .mockReturnValue(mockBatch);
            jest
              .spyOn(inventoryBatchRepository, 'save')
              .mockResolvedValue(mockBatch);

            const beforeCall = new Date();
            // Add a small buffer to account for timing precision
            beforeCall.setMilliseconds(beforeCall.getMilliseconds() - 1);
            const result = await service.createBatchForReceivedItem(
              mockReceivedItem,
              mockPurchaseOrder,
              scenario.lineItemId,
              scenario.userId,
            );
            const afterCall = new Date();
            // Add a small buffer to account for timing precision
            afterCall.setMilliseconds(afterCall.getMilliseconds() + 1);

            // Verify audit fields
            expect(result.created_by).toBe(scenario.userId);
            expect(result.created_at).toBeInstanceOf(Date);
            expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCall.getTime());
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
