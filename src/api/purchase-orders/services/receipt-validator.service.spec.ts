import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fc from 'fast-check';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReceiptValidatorService } from './receipt-validator.service';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

describe('ReceiptValidatorService', () => {
  let service: ReceiptValidatorService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceiptValidatorService,
        {
          provide: getRepositoryToken(PurchaseOrderBatchDetail),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ReceiptValidatorService>(ReceiptValidatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Unit Tests', () => {
    describe('validateReceivedItems', () => {
      it('should pass validation when at least one item has quantity > 0', async () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        mockRepository.findOne.mockResolvedValue({
          id: items[0].line_item_id,
        });

        await expect(service.validateReceivedItems(items)).resolves.not.toThrow();
      });

      it('should reject when all quantities are zero', async () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 0,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        // Mock the line item to exist
        mockRepository.findOne.mockResolvedValue({
          id: items[0].line_item_id,
        });

        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          'Se debe recibir al menos un producto con cantidad mayor a cero',
        );
      });

      it('should reject when quantity is negative', async () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: -5,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          'La cantidad recibida no puede ser negativa para la línea',
        );
      });

      it('should reject when quantity exceeds 999,999.999', async () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 1000000,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          'exceeds maximum limit',
        );
      });

      it('should reject when line item does not exist', async () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        mockRepository.findOne.mockResolvedValue(null);

        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          'Línea no encontrada',
        );
      });

      it('should include line item ID in error message for negative quantity', async () => {
        const lineItemId = '550e8400-e29b-41d4-a716-446655440000';
        const items: ReceivedItemDto[] = [
          {
            line_item_id: lineItemId,
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: -5,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        try {
          await service.validateReceivedItems(items);
          fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error.message).toContain(lineItemId);
        }
      });

      it('should include line item ID in error message for exceeding limit', async () => {
        const lineItemId = '550e8400-e29b-41d4-a716-446655440000';
        const items: ReceivedItemDto[] = [
          {
            line_item_id: lineItemId,
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 1000000,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        try {
          await service.validateReceivedItems(items);
          fail('Should have thrown BadRequestException');
        } catch (error) {
          expect(error.message).toContain(lineItemId);
        }
      });

      it('should validate multiple items and reject if any is invalid', async () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440003',
            product_id: '550e8400-e29b-41d4-a716-446655440004',
            uom_id: '550e8400-e29b-41d4-a716-446655440005',
            quantity: -5,
            unit_total: 100,
            iva_percentage: 16,
            iva_unit: 16,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        mockRepository.findOne.mockResolvedValue({
          id: items[0].line_item_id,
        });

        await expect(service.validateReceivedItems(items)).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 1: At Least One Item Must Be Received', () => {
      it('should reject when all quantities are zero or missing', async () => {
        // **Validates: Requirements 2.1, 2.2**
        const testCases = fc.sample(
          fc.array(
            fc.record({
              line_item_id: fc.uuid(),
              product_id: fc.uuid(),
              uom_id: fc.uuid(),
              quantity: fc.constant(0),
              unit_total: fc.integer({ min: 1, max: 10000 }),
              iva_percentage: fc.integer({ min: 0, max: 100 }),
              iva_unit: fc.integer({ min: 0, max: 10000 }),
              ieps_percentage: fc.integer({ min: 0, max: 100 }),
              ieps_unit: fc.integer({ min: 0, max: 10000 }),
            }),
            { minLength: 1 },
          ),
          10
        );

        for (const items of testCases) {
          mockRepository.findOne.mockResolvedValue({ id: 'some-id' });
          await expect(service.validateReceivedItems(items)).rejects.toThrow(
            BadRequestException,
          );
        }
      });

      it('should accept when at least one item has quantity > 0', async () => {
        // **Validates: Requirements 2.1, 2.2**
        const testCases = fc.sample(
          fc.tuple(
            fc.array(
              fc.record({
                line_item_id: fc.uuid(),
                product_id: fc.uuid(),
                uom_id: fc.uuid(),
                quantity: fc.constant(0),
                unit_total: fc.integer({ min: 1, max: 10000 }),
                iva_percentage: fc.integer({ min: 0, max: 100 }),
                iva_unit: fc.integer({ min: 0, max: 10000 }),
                ieps_percentage: fc.integer({ min: 0, max: 100 }),
                ieps_unit: fc.integer({ min: 0, max: 10000 }),
              }),
              { maxLength: 5 },
            ),
            fc.record({
              line_item_id: fc.uuid(),
              product_id: fc.uuid(),
              uom_id: fc.uuid(),
              quantity: fc.integer({ min: 1, max: 999999 }),
              unit_total: fc.integer({ min: 1, max: 10000 }),
              iva_percentage: fc.integer({ min: 0, max: 100 }),
              iva_unit: fc.integer({ min: 0, max: 10000 }),
              ieps_percentage: fc.integer({ min: 0, max: 100 }),
              ieps_unit: fc.integer({ min: 0, max: 10000 }),
            }),
          ),
          10
        );

        for (const [zeroItems, validItem] of testCases) {
          const items = [...zeroItems, validItem];
          mockRepository.findOne.mockResolvedValue({ id: 'some-id' });
          await expect(service.validateReceivedItems(items)).resolves.not.toThrow();
        }
      });
    });

    describe('Property 2: Quantities Must Be Non-Negative', () => {
      it('should reject any item with negative quantity', async () => {
        // **Validates: Requirements 2.3, 2.4**
        const testCases = fc.sample(
          fc.record({
            line_item_id: fc.uuid(),
            product_id: fc.uuid(),
            uom_id: fc.uuid(),
            quantity: fc.integer({ min: -999999, max: -1 }),
            unit_total: fc.integer({ min: 1, max: 10000 }),
            iva_percentage: fc.integer({ min: 0, max: 100 }),
            iva_unit: fc.integer({ min: 0, max: 10000 }),
            ieps_percentage: fc.integer({ min: 0, max: 100 }),
            ieps_unit: fc.integer({ min: 0, max: 10000 }),
          }),
          10
        );

        for (const item of testCases) {
          await expect(service.validateReceivedItems([item])).rejects.toThrow(
            BadRequestException,
          );
        }
      });

      it('should accept positive quantities', async () => {
        // **Validates: Requirements 2.3, 2.4**
        const testCases = fc.sample(
          fc.record({
            line_item_id: fc.uuid(),
            product_id: fc.uuid(),
            uom_id: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            unit_total: fc.integer({ min: 1, max: 10000 }),
            iva_percentage: fc.integer({ min: 0, max: 100 }),
            iva_unit: fc.integer({ min: 0, max: 10000 }),
            ieps_percentage: fc.integer({ min: 0, max: 100 }),
            ieps_unit: fc.integer({ min: 0, max: 10000 }),
          }),
          10
        );

        for (const item of testCases) {
          mockRepository.findOne.mockResolvedValue({ id: item.line_item_id });
          await expect(service.validateReceivedItems([item])).resolves.not.toThrow();
        }
      });
    });

    describe('Property 3: Quantities Must Not Exceed Limits', () => {
      it('should reject quantities exceeding 999,999.999', async () => {
        // **Validates: Requirements 2.5**
        const testCases = fc.sample(
          fc.record({
            line_item_id: fc.uuid(),
            product_id: fc.uuid(),
            uom_id: fc.uuid(),
            quantity: fc.integer({ min: 1000000, max: 9999999 }),
            unit_total: fc.integer({ min: 1, max: 10000 }),
            iva_percentage: fc.integer({ min: 0, max: 100 }),
            iva_unit: fc.integer({ min: 0, max: 10000 }),
            ieps_percentage: fc.integer({ min: 0, max: 100 }),
            ieps_unit: fc.integer({ min: 0, max: 10000 }),
          }),
          10
        );

        for (const item of testCases) {
          await expect(service.validateReceivedItems([item])).rejects.toThrow(
            BadRequestException,
          );
        }
      });

      it('should accept quantities within valid range', async () => {
        // **Validates: Requirements 2.5**
        const testCases = fc.sample(
          fc.record({
            line_item_id: fc.uuid(),
            product_id: fc.uuid(),
            uom_id: fc.uuid(),
            quantity: fc.integer({ min: 1, max: 999999 }),
            unit_total: fc.integer({ min: 1, max: 10000 }),
            iva_percentage: fc.integer({ min: 0, max: 100 }),
            iva_unit: fc.integer({ min: 0, max: 10000 }),
            ieps_percentage: fc.integer({ min: 0, max: 100 }),
            ieps_unit: fc.integer({ min: 0, max: 10000 }),
          }),
          10
        );

        for (const item of testCases) {
          mockRepository.findOne.mockResolvedValue({ id: item.line_item_id });
          await expect(service.validateReceivedItems([item])).resolves.not.toThrow();
        }
      });
    });
  });
});
