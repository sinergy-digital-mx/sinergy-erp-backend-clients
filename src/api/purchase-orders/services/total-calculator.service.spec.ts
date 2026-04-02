import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { TotalCalculatorService } from './total-calculator.service';
import { ReceivedItemDto } from '../dto/receive-purchase-order.dto';

describe('TotalCalculatorService', () => {
  let service: TotalCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TotalCalculatorService],
    }).compile();

    service = module.get<TotalCalculatorService>(TotalCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Unit Tests', () => {
    describe('calculateReceivedSubtotal', () => {
      it('should calculate subtotal for single item', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 160.8,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedSubtotal(items);
        expect(result).toBe(1005.0);
      });

      it('should calculate subtotal for multiple items', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 160.8,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440003',
            product_id: '550e8400-e29b-41d4-a716-446655440004',
            uom_id: '550e8400-e29b-41d4-a716-446655440005',
            quantity: 5,
            unit_total: 50.25,
            iva_percentage: 16,
            iva_unit: 80.4,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedSubtotal(items);
        expect(result).toBe(1256.25); // (10 * 100.5) + (5 * 50.25)
      });

      it('should round to 2 decimal places', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 3,
            unit_total: 10.33,
            iva_percentage: 16,
            iva_unit: 16.528,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedSubtotal(items);
        expect(result).toBe(30.99); // 3 * 10.33 = 30.99
      });

      it('should handle empty array', () => {
        const items: ReceivedItemDto[] = [];
        const result = service.calculateReceivedSubtotal(items);
        expect(result).toBe(0);
      });

      it('should handle zero quantities', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 0,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 160.8,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedSubtotal(items);
        expect(result).toBe(0);
      });

      it('should handle decimal quantities', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 2.5,
            unit_total: 40.0,
            iva_percentage: 16,
            iva_unit: 64.0,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedSubtotal(items);
        expect(result).toBe(100.0);
      });
    });

    describe('calculateReceivedIvaTotal', () => {
      it('should calculate IVA total for single item', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 16.08,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedIvaTotal(items);
        expect(result).toBe(160.8);
      });

      it('should calculate IVA total for multiple items', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 16.08,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440003',
            product_id: '550e8400-e29b-41d4-a716-446655440004',
            uom_id: '550e8400-e29b-41d4-a716-446655440005',
            quantity: 5,
            unit_total: 50.25,
            iva_percentage: 16,
            iva_unit: 8.04,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedIvaTotal(items);
        // (10 * 16.08) + (5 * 8.04) = 160.8 + 40.2 = 201.0
        expect(result).toBe(201.0);
      });

      it('should round to 2 decimal places', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 3,
            unit_total: 10.33,
            iva_percentage: 16,
            iva_unit: 1.6528,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedIvaTotal(items);
        expect(result).toBe(4.96); // 3 * 1.6528 = 4.9584, rounded to 4.96
      });

      it('should handle zero IVA', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 0,
            iva_unit: 0,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedIvaTotal(items);
        expect(result).toBe(0);
      });
    });

    describe('calculateReceivedIepsTotal', () => {
      it('should calculate IEPS total for single item', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 16.08,
            ieps_percentage: 8,
            ieps_unit: 8.04,
          },
        ];

        const result = service.calculateReceivedIepsTotal(items);
        expect(result).toBe(80.4);
      });

      it('should calculate IEPS total for multiple items', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 16.08,
            ieps_percentage: 8,
            ieps_unit: 8.04,
          },
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440003',
            product_id: '550e8400-e29b-41d4-a716-446655440004',
            uom_id: '550e8400-e29b-41d4-a716-446655440005',
            quantity: 5,
            unit_total: 50.25,
            iva_percentage: 16,
            iva_unit: 8.04,
            ieps_percentage: 8,
            ieps_unit: 4.02,
          },
        ];

        const result = service.calculateReceivedIepsTotal(items);
        // (10 * 8.04) + (5 * 4.02) = 80.4 + 20.1 = 100.5
        expect(result).toBe(100.5);
      });

      it('should round to 2 decimal places', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 3,
            unit_total: 10.33,
            iva_percentage: 16,
            iva_unit: 1.6528,
            ieps_percentage: 8,
            ieps_unit: 0.8264,
          },
        ];

        const result = service.calculateReceivedIepsTotal(items);
        expect(result).toBe(2.48); // 3 * 0.8264 = 2.4792, rounded to 2.48
      });

      it('should handle zero IEPS', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.5,
            iva_percentage: 16,
            iva_unit: 16.08,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedIepsTotal(items);
        expect(result).toBe(0);
      });
    });

    describe('calculateReceivedTotal', () => {
      it('should calculate total as subtotal + iva + ieps', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.0,
            iva_percentage: 16,
            iva_unit: 16.0,
            ieps_percentage: 8,
            ieps_unit: 8.0,
          },
        ];

        const result = service.calculateReceivedTotal(items);
        expect(result).toBe(1240.0); // (10 * 100) + (10 * 16) + (10 * 8)
      });

      it('should calculate total for multiple items', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.0,
            iva_percentage: 16,
            iva_unit: 16.0,
            ieps_percentage: 8,
            ieps_unit: 8.0,
          },
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440003',
            product_id: '550e8400-e29b-41d4-a716-446655440004',
            uom_id: '550e8400-e29b-41d4-a716-446655440005',
            quantity: 5,
            unit_total: 50.0,
            iva_percentage: 16,
            iva_unit: 8.0,
            ieps_percentage: 8,
            ieps_unit: 4.0,
          },
        ];

        const result = service.calculateReceivedTotal(items);
        // Subtotal: (10 * 100) + (5 * 50) = 1250
        // IVA: (10 * 16) + (5 * 8) = 200
        // IEPS: (10 * 8) + (5 * 4) = 100
        // Total: 1250 + 200 + 100 = 1550
        expect(result).toBe(1550.0);
      });

      it('should round to 2 decimal places', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 3,
            unit_total: 10.33,
            iva_percentage: 16,
            iva_unit: 1.6528,
            ieps_percentage: 8,
            ieps_unit: 0.8264,
          },
        ];

        const result = service.calculateReceivedTotal(items);
        // Subtotal: 3 * 10.33 = 30.99
        // IVA: 3 * 1.6528 = 4.9584 → 4.96
        // IEPS: 3 * 0.8264 = 2.4792 → 2.48
        // Total: 30.99 + 4.96 + 2.48 = 38.43
        expect(result).toBe(38.43);
      });

      it('should handle items with no taxes', () => {
        const items: ReceivedItemDto[] = [
          {
            line_item_id: '550e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440001',
            uom_id: '550e8400-e29b-41d4-a716-446655440002',
            quantity: 10,
            unit_total: 100.0,
            iva_percentage: 0,
            iva_unit: 0,
            ieps_percentage: 0,
            ieps_unit: 0,
          },
        ];

        const result = service.calculateReceivedTotal(items);
        expect(result).toBe(1000.0);
      });

      it('should handle empty array', () => {
        const items: ReceivedItemDto[] = [];
        const result = service.calculateReceivedTotal(items);
        expect(result).toBe(0);
      });
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 14: Received Subtotal Calculation', () => {
      it('should calculate subtotal as sum of (quantity × unit_total) for all items', () => {
        // **Validates: Requirements 5.1**
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                line_item_id: fc.uuid(),
                product_id: fc.uuid(),
                uom_id: fc.uuid(),
                quantity: fc.float({ min: Math.fround(0.001), max: 100000 }),
                unit_total: fc.float({ min: 0, max: 10000 }),
                iva_percentage: fc.float({ min: 0, max: 100 }),
                iva_unit: fc.float({ min: 0, max: 10000 }),
                ieps_percentage: fc.float({ min: 0, max: 100 }),
                ieps_unit: fc.float({ min: 0, max: 10000 }),
              }),
              { minLength: 1, maxLength: 100 },
            ),
            (items) => {
              // Filter out NaN values
              const validItems = items.filter(
                (item) =>
                  !isNaN(item.quantity) &&
                  !isNaN(item.unit_total) &&
                  isFinite(item.quantity) &&
                  isFinite(item.unit_total),
              );

              if (validItems.length === 0) {
                return true; // Skip this test case
              }

              const result = service.calculateReceivedSubtotal(validItems as ReceivedItemDto[]);
              const expected = validItems.reduce((sum, item) => sum + item.quantity * item.unit_total, 0);
              const expectedRounded = Math.round(expected * 100) / 100;

              expect(result).toBeCloseTo(expectedRounded, 2);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('Property 15: Received IVA Calculation', () => {
      it('should calculate IVA total as sum of (iva_unit × quantity) for all items', () => {
        // **Validates: Requirements 5.2**
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                line_item_id: fc.uuid(),
                product_id: fc.uuid(),
                uom_id: fc.uuid(),
                quantity: fc.float({ min: Math.fround(0.001), max: 100000 }),
                unit_total: fc.float({ min: 0, max: 10000 }),
                iva_percentage: fc.float({ min: 0, max: 100 }),
                iva_unit: fc.float({ min: 0, max: 10000 }),
                ieps_percentage: fc.float({ min: 0, max: 100 }),
                ieps_unit: fc.float({ min: 0, max: 10000 }),
              }),
              { minLength: 1, maxLength: 100 },
            ),
            (items) => {
              // Filter out NaN values
              const validItems = items.filter(
                (item) =>
                  !isNaN(item.quantity) &&
                  !isNaN(item.iva_unit) &&
                  isFinite(item.quantity) &&
                  isFinite(item.iva_unit),
              );

              if (validItems.length === 0) {
                return true; // Skip this test case
              }

              const result = service.calculateReceivedIvaTotal(validItems as ReceivedItemDto[]);
              const expected = validItems.reduce((sum, item) => sum + item.iva_unit * item.quantity, 0);
              const expectedRounded = Math.round(expected * 100) / 100;

              expect(result).toBeCloseTo(expectedRounded, 2);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('Property 16: Received IEPS Calculation', () => {
      it('should calculate IEPS total as sum of (ieps_unit × quantity) for all items', () => {
        // **Validates: Requirements 5.3**
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                line_item_id: fc.uuid(),
                product_id: fc.uuid(),
                uom_id: fc.uuid(),
                quantity: fc.float({ min: Math.fround(0.001), max: 100000 }),
                unit_total: fc.float({ min: 0, max: 10000 }),
                iva_percentage: fc.float({ min: 0, max: 100 }),
                iva_unit: fc.float({ min: 0, max: 10000 }),
                ieps_percentage: fc.float({ min: 0, max: 100 }),
                ieps_unit: fc.float({ min: 0, max: 10000 }),
              }),
              { minLength: 1, maxLength: 100 },
            ),
            (items) => {
              // Filter out NaN values
              const validItems = items.filter(
                (item) =>
                  !isNaN(item.quantity) &&
                  !isNaN(item.ieps_unit) &&
                  isFinite(item.quantity) &&
                  isFinite(item.ieps_unit),
              );

              if (validItems.length === 0) {
                return true; // Skip this test case
              }

              const result = service.calculateReceivedIepsTotal(validItems as ReceivedItemDto[]);
              const expected = validItems.reduce((sum, item) => sum + item.ieps_unit * item.quantity, 0);
              const expectedRounded = Math.round(expected * 100) / 100;

              expect(result).toBeCloseTo(expectedRounded, 2);
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('Property 17: Received Total Calculation', () => {
      it('should calculate total as (subtotal + iva_total + ieps_total)', () => {
        // **Validates: Requirements 5.4**
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                line_item_id: fc.uuid(),
                product_id: fc.uuid(),
                uom_id: fc.uuid(),
                quantity: fc.float({ min: Math.fround(0.001), max: 100000 }),
                unit_total: fc.float({ min: 0, max: 10000 }),
                iva_percentage: fc.float({ min: 0, max: 100 }),
                iva_unit: fc.float({ min: 0, max: 10000 }),
                ieps_percentage: fc.float({ min: 0, max: 100 }),
                ieps_unit: fc.float({ min: 0, max: 10000 }),
              }),
              { minLength: 1, maxLength: 100 },
            ),
            (items) => {
              // Filter out NaN values
              const validItems = items.filter(
                (item) =>
                  !isNaN(item.quantity) &&
                  !isNaN(item.unit_total) &&
                  !isNaN(item.iva_unit) &&
                  !isNaN(item.ieps_unit) &&
                  isFinite(item.quantity) &&
                  isFinite(item.unit_total) &&
                  isFinite(item.iva_unit) &&
                  isFinite(item.ieps_unit),
              );

              if (validItems.length === 0) {
                return true; // Skip this test case
              }

              const result = service.calculateReceivedTotal(validItems as ReceivedItemDto[]);
              const subtotal = service.calculateReceivedSubtotal(validItems as ReceivedItemDto[]);
              const ivaTotal = service.calculateReceivedIvaTotal(validItems as ReceivedItemDto[]);
              const iepsTotal = service.calculateReceivedIepsTotal(validItems as ReceivedItemDto[]);
              const expected = subtotal + ivaTotal + iepsTotal;
              const expectedRounded = Math.round(expected * 100) / 100;

              expect(result).toBeCloseTo(expectedRounded, 2);
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });
});
