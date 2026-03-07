import { Test, TestingModule } from '@nestjs/testing';
import { TaxCalculationService } from './tax-calculation.service';
import { fc } from 'fast-check';

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxCalculationService],
    }).compile();

    service = module.get<TaxCalculationService>(TaxCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateLineItemTotals', () => {
    it('should calculate subtotal correctly', () => {
      const result = service.calculateLineItemTotals(10, 100, 0, 0);
      expect(result.subtotal).toBe(1000);
    });

    it('should calculate IVA correctly', () => {
      const result = service.calculateLineItemTotals(10, 100, 16, 0);
      expect(result.iva_amount).toBe(160);
    });

    it('should calculate IEPS correctly', () => {
      const result = service.calculateLineItemTotals(10, 100, 0, 8);
      expect(result.ieps_amount).toBe(80);
    });

    it('should calculate line total correctly', () => {
      const result = service.calculateLineItemTotals(10, 100, 16, 8);
      expect(result.line_total).toBe(1240);
    });
  });

  describe('calculateOrderTotals', () => {
    it('should sum line item totals correctly', () => {
      const lineItems = [
        { subtotal: 100, iva_amount: 16, ieps_amount: 8, line_total: 124 },
        { subtotal: 200, iva_amount: 32, ieps_amount: 16, line_total: 248 },
      ];

      const result = service.calculateOrderTotals(lineItems);
      expect(result.total_subtotal).toBe(300);
      expect(result.total_iva).toBe(48);
      expect(result.total_ieps).toBe(24);
      expect(result.grand_total).toBe(372);
    });
  });

  describe('Property 5: Line Item Subtotal Calculation', () => {
    it('should calculate subtotal as quantity × unit_price', () => {
      // **Validates: Requirements 2.1**
      const property = fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 10000 }),
        (quantity, unitPrice) => {
          const result = service.calculateLineItemTotals(quantity, unitPrice, 0, 0);
          const expected = quantity * unitPrice;
          expect(result.subtotal).toBe(expected);
        },
      );

      fc.assert(property, { numRuns: 100 });
    });
  });

  describe('Property 6: IVA and IEPS Calculation', () => {
    it('should calculate IVA and IEPS as percentage of subtotal', () => {
      // **Validates: Requirements 2.2**
      const property = fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (quantity, unitPrice, ivaPercentage, iepsPercentage) => {
          const result = service.calculateLineItemTotals(
            quantity,
            unitPrice,
            ivaPercentage,
            iepsPercentage,
          );

          const subtotal = quantity * unitPrice;
          const expectedIva = (subtotal * ivaPercentage) / 100;
          const expectedIeps = (subtotal * iepsPercentage) / 100;

          expect(Math.abs(result.iva_amount - expectedIva)).toBeLessThan(0.01);
          expect(Math.abs(result.ieps_amount - expectedIeps)).toBeLessThan(0.01);
        },
      );

      fc.assert(property, { numRuns: 100 });
    });
  });

  describe('Property 7: Line Item Total Calculation', () => {
    it('should calculate line_total as subtotal + IVA + IEPS', () => {
      // **Validates: Requirements 2.3**
      const property = fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (quantity, unitPrice, ivaPercentage, iepsPercentage) => {
          const result = service.calculateLineItemTotals(
            quantity,
            unitPrice,
            ivaPercentage,
            iepsPercentage,
          );

          const expected = result.subtotal + result.iva_amount + result.ieps_amount;
          expect(Math.abs(result.line_total - expected)).toBeLessThan(0.01);
        },
      );

      fc.assert(property, { numRuns: 100 });
    });
  });

  describe('Property 8: Order Totals Calculation', () => {
    it('should sum all line item totals correctly', () => {
      // **Validates: Requirements 2.4**
      const property = fc.property(
        fc.array(
          fc.record({
            subtotal: fc.integer({ min: 1, max: 10000 }),
            iva_amount: fc.integer({ min: 0, max: 1000 }),
            ieps_amount: fc.integer({ min: 0, max: 1000 }),
            line_total: fc.integer({ min: 1, max: 12000 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        (lineItems) => {
          const result = service.calculateOrderTotals(lineItems);

          let expectedSubtotal = 0;
          let expectedIva = 0;
          let expectedIeps = 0;

          for (const item of lineItems) {
            expectedSubtotal += item.subtotal;
            expectedIva += item.iva_amount;
            expectedIeps += item.ieps_amount;
          }

          const expectedGrandTotal = expectedSubtotal + expectedIva + expectedIeps;

          expect(result.total_subtotal).toBe(expectedSubtotal);
          expect(result.total_iva).toBe(expectedIva);
          expect(result.total_ieps).toBe(expectedIeps);
          expect(result.grand_total).toBe(expectedGrandTotal);
        },
      );

      fc.assert(property, { numRuns: 100 });
    });
  });
});
