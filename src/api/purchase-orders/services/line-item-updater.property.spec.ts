import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { LineItemUpdaterService } from './line-item-updater.service';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

/**
 * Property-Based Tests for LineItemUpdaterService
 * **Validates: Requirements 7.1 through 7.12**
 */
describe('LineItemUpdaterService - Property-Based Tests', () => {
  let service: LineItemUpdaterService;

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
  });

  describe('Property 18: Line Item Original Data Preserved', () => {
    it('should preserve all received_original_* fields from the received item', async () => {
      // **Validates: Requirements 7.1 through 7.8**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lineItemId: fc.uuid(),
            userId: fc.uuid(),
            baseUomId: fc.uuid(),
            convertedQuantity: fc.integer({ min: 1, max: 999999 }),
            receivedItem: fc.record({
              line_item_id: fc.uuid(),
              product_id: fc.uuid(),
              uom_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 999999 }),
              unit_total: fc.integer({ min: 0, max: 100000 }),
              iva_percentage: fc.integer({ min: 0, max: 100 }),
              iva_unit: fc.integer({ min: 0, max: 100000 }),
              ieps_percentage: fc.integer({ min: 0, max: 100 }),
              ieps_unit: fc.integer({ min: 0, max: 100000 }),
            }),
          }),
          async (scenario) => {
            // Create a fresh module for each test iteration to avoid mock state issues
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

            const testService = module.get<LineItemUpdaterService>(LineItemUpdaterService);
            const lineItemRepository = module.get<Repository<PurchaseOrderBatchDetail>>(
              getRepositoryToken(PurchaseOrderBatchDetail),
            );

            const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
              id: scenario.lineItemId,
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

            jest
              .spyOn(lineItemRepository, 'findOne')
              .mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
            jest
              .spyOn(lineItemRepository, 'save')
              .mockImplementation((item) => Promise.resolve(item as PurchaseOrderBatchDetail));

            await testService.updateLineItemWithReceivedData(
              scenario.lineItemId,
              scenario.receivedItem as ReceivedItemDto,
              scenario.convertedQuantity,
              scenario.baseUomId,
              scenario.userId,
            );

            const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];

            // Verify all received_original_* fields are preserved
            expect(savedItem.received_original_product_id).toBe(scenario.receivedItem.product_id);
            expect(savedItem.received_original_uom_id).toBe(scenario.receivedItem.uom_id);
            expect(savedItem.received_original_quantity).toBe(scenario.receivedItem.quantity);
            expect(savedItem.received_original_unit_total).toBe(scenario.receivedItem.unit_total);
            expect(savedItem.received_original_iva_percentage).toBe(
              scenario.receivedItem.iva_percentage,
            );
            expect(savedItem.received_original_iva_unit).toBe(scenario.receivedItem.iva_unit);
            expect(savedItem.received_original_ieps_percentage).toBe(
              scenario.receivedItem.ieps_percentage,
            );
            expect(savedItem.received_original_ieps_unit).toBe(scenario.receivedItem.ieps_unit);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 19: Line Item Converted Data Stored', () => {
    it('should store received_converted_quantity and received_converted_uom_id', async () => {
      // **Validates: Requirements 7.9, 7.10**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lineItemId: fc.uuid(),
            userId: fc.uuid(),
            baseUomId: fc.uuid(),
            convertedQuantity: fc.integer({ min: 1, max: 999999 }),
            receivedItem: fc.record({
              line_item_id: fc.uuid(),
              product_id: fc.uuid(),
              uom_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 999999 }),
              unit_total: fc.integer({ min: 0, max: 100000 }),
              iva_percentage: fc.integer({ min: 0, max: 100 }),
              iva_unit: fc.integer({ min: 0, max: 100000 }),
              ieps_percentage: fc.integer({ min: 0, max: 100 }),
              ieps_unit: fc.integer({ min: 0, max: 100000 }),
            }),
          }),
          async (scenario) => {
            // Create a fresh module for each test iteration to avoid mock state issues
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

            const testService = module.get<LineItemUpdaterService>(LineItemUpdaterService);
            const lineItemRepository = module.get<Repository<PurchaseOrderBatchDetail>>(
              getRepositoryToken(PurchaseOrderBatchDetail),
            );

            const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
              id: scenario.lineItemId,
              received_converted_quantity: null,
              received_converted_uom_id: null,
              updated_at: new Date(),
            };

            jest
              .spyOn(lineItemRepository, 'findOne')
              .mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
            jest
              .spyOn(lineItemRepository, 'save')
              .mockImplementation((item) => Promise.resolve(item as PurchaseOrderBatchDetail));

            await testService.updateLineItemWithReceivedData(
              scenario.lineItemId,
              scenario.receivedItem as ReceivedItemDto,
              scenario.convertedQuantity,
              scenario.baseUomId,
              scenario.userId,
            );

            const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];

            // Verify converted data is stored
            expect(savedItem.received_converted_quantity).toBe(scenario.convertedQuantity);
            expect(savedItem.received_converted_uom_id).toBe(scenario.baseUomId);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property 20: Line Item Audit Fields Updated', () => {
    it('should update audit fields (updated_by, updated_at) with current user and timestamp', async () => {
      // **Validates: Requirements 7.11, 7.12**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lineItemId: fc.uuid(),
            userId: fc.uuid(),
            baseUomId: fc.uuid(),
            convertedQuantity: fc.integer({ min: 1, max: 999999 }),
            receivedItem: fc.record({
              line_item_id: fc.uuid(),
              product_id: fc.uuid(),
              uom_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 999999 }),
              unit_total: fc.integer({ min: 0, max: 100000 }),
              iva_percentage: fc.integer({ min: 0, max: 100 }),
              iva_unit: fc.integer({ min: 0, max: 100000 }),
              ieps_percentage: fc.integer({ min: 0, max: 100 }),
              ieps_unit: fc.integer({ min: 0, max: 100000 }),
            }),
          }),
          async (scenario) => {
            // Create a fresh module for each test iteration to avoid mock state issues
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

            const testService = module.get<LineItemUpdaterService>(LineItemUpdaterService);
            const lineItemRepository = module.get<Repository<PurchaseOrderBatchDetail>>(
              getRepositoryToken(PurchaseOrderBatchDetail),
            );

            const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
              id: scenario.lineItemId,
              updated_by: null,
              updated_at: new Date('2024-01-01'),
            };

            jest
              .spyOn(lineItemRepository, 'findOne')
              .mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
            jest
              .spyOn(lineItemRepository, 'save')
              .mockImplementation((item) => Promise.resolve(item as PurchaseOrderBatchDetail));

            const beforeUpdate = new Date();
            await testService.updateLineItemWithReceivedData(
              scenario.lineItemId,
              scenario.receivedItem as ReceivedItemDto,
              scenario.convertedQuantity,
              scenario.baseUomId,
              scenario.userId,
            );
            const afterUpdate = new Date();

            const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];

            // Verify audit fields are updated
            expect(savedItem.updated_by).toBe(scenario.userId);
            expect(savedItem.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
            expect(savedItem.updated_at.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Property: All Fields Updated Together', () => {
    it('should update all fields (original, converted, and audit) in a single operation', async () => {
      // **Validates: Requirements 7.1 through 7.12**
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            lineItemId: fc.uuid(),
            userId: fc.uuid(),
            baseUomId: fc.uuid(),
            convertedQuantity: fc.integer({ min: 1, max: 999999 }),
            receivedItem: fc.record({
              line_item_id: fc.uuid(),
              product_id: fc.uuid(),
              uom_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 999999 }),
              unit_total: fc.integer({ min: 0, max: 100000 }),
              iva_percentage: fc.integer({ min: 0, max: 100 }),
              iva_unit: fc.integer({ min: 0, max: 100000 }),
              ieps_percentage: fc.integer({ min: 0, max: 100 }),
              ieps_unit: fc.integer({ min: 0, max: 100000 }),
            }),
          }),
          async (scenario) => {
            // Create a fresh module for each test iteration to avoid mock state issues
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

            const testService = module.get<LineItemUpdaterService>(LineItemUpdaterService);
            const lineItemRepository = module.get<Repository<PurchaseOrderBatchDetail>>(
              getRepositoryToken(PurchaseOrderBatchDetail),
            );

            const mockLineItem: Partial<PurchaseOrderBatchDetail> = {
              id: scenario.lineItemId,
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

            jest
              .spyOn(lineItemRepository, 'findOne')
              .mockResolvedValue(mockLineItem as PurchaseOrderBatchDetail);
            jest
              .spyOn(lineItemRepository, 'save')
              .mockImplementation((item) => Promise.resolve(item as PurchaseOrderBatchDetail));

            await testService.updateLineItemWithReceivedData(
              scenario.lineItemId,
              scenario.receivedItem as ReceivedItemDto,
              scenario.convertedQuantity,
              scenario.baseUomId,
              scenario.userId,
            );

            // Verify save was called exactly once
            expect(lineItemRepository.save).toHaveBeenCalledTimes(1);

            const savedItem = (lineItemRepository.save as jest.Mock).mock.calls[0][0];

            // Verify all fields are present in the saved item
            expect(savedItem.received_original_product_id).toBeDefined();
            expect(savedItem.received_original_uom_id).toBeDefined();
            expect(savedItem.received_original_quantity).toBeDefined();
            expect(savedItem.received_original_unit_total).toBeDefined();
            expect(savedItem.received_original_iva_percentage).toBeDefined();
            expect(savedItem.received_original_iva_unit).toBeDefined();
            expect(savedItem.received_original_ieps_percentage).toBeDefined();
            expect(savedItem.received_original_ieps_unit).toBeDefined();
            expect(savedItem.received_converted_quantity).toBeDefined();
            expect(savedItem.received_converted_uom_id).toBeDefined();
            expect(savedItem.updated_by).toBeDefined();
            expect(savedItem.updated_at).toBeDefined();
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
