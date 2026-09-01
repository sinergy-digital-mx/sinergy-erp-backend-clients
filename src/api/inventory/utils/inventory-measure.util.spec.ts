import {
  buildMeasureTotals,
  formatMeasure,
  formatMeasureLabel,
  formatMeasureTotalsLabel,
  mapBatchMeasure,
  normalizeMeasure,
} from './inventory-measure.util';

describe('inventory-measure.util', () => {
  describe('formatMeasure', () => {
    it('trims trailing zeros', () => {
      expect(formatMeasure(12)).toBe('12');
      expect(formatMeasure('8.500')).toBe('8.5');
    });

    it('returns null when empty or invalid', () => {
      expect(formatMeasure(null)).toBeNull();
      expect(formatMeasure(0)).toBeNull();
    });
  });

  describe('formatMeasureLabel', () => {
    it('joins size and size-unit, never inventory UOM', () => {
      expect(formatMeasureLabel(8, 'Foot')).toBe('8 Foot');
      expect(formatMeasureLabel(12, 'PIES')).toBe('12 PIES');
      expect(formatMeasureLabel(8, 'PT')).toBe('8 PT');
    });

    it('omits unit when missing', () => {
      expect(formatMeasureLabel(8, null)).toBe('8');
    });
  });

  describe('mapBatchMeasure', () => {
    it('builds label from measure_uom name', () => {
      expect(
        mapBatchMeasure({
          measure: 8,
          measure_uom_id: 'uom-foot',
          measure_uom: { id: 'uom-foot', name: 'Foot' },
        }),
      ).toEqual({
        measure: '8',
        measure_uom_id: 'uom-foot',
        measure_uom_name: 'Foot',
        measure_label: '8 Foot',
      });
    });

    it('clears unit when there is no size', () => {
      expect(
        mapBatchMeasure({
          measure: null,
          measure_uom_id: 'uom-foot',
          measure_uom: { name: 'Foot' },
        }),
      ).toEqual({
        measure: null,
        measure_uom_id: null,
        measure_uom_name: null,
        measure_label: null,
      });
    });
  });

  describe('normalizeMeasure', () => {
    it('returns a number rounded to 3 decimals', () => {
      expect(normalizeMeasure('12')).toBe(12);
    });
  });

  describe('buildMeasureTotals', () => {
    it('returns empty when no batch has measure', () => {
      expect(
        buildMeasureTotals([
          { measure: null, available_quantity: 10, initial_quantity: 10 },
        ]),
      ).toEqual([]);
    });

    it('groups the same SKU by size and size-unit', () => {
      const totals = buildMeasureTotals([
        {
          measure: 8,
          measure_uom_id: 'foot',
          measure_uom_name: 'Foot',
          available_quantity: 80,
          initial_quantity: 100,
        },
        {
          measure: 8,
          measure_uom_id: 'foot',
          measure_uom_name: 'Foot',
          available_quantity: 40,
          initial_quantity: 40,
        },
        {
          measure: 12,
          measure_uom_id: 'pies',
          measure_uom_name: 'PIES',
          available_quantity: 60,
          initial_quantity: 60,
        },
      ]);

      expect(totals).toEqual([
        {
          measure: '8',
          measure_uom_id: 'foot',
          measure_uom_name: 'Foot',
          measure_label: '8 Foot',
          total_available_quantity: '120.000',
          total_initial_quantity: '140.000',
          total_batches: 2,
        },
        {
          measure: '12',
          measure_uom_id: 'pies',
          measure_uom_name: 'PIES',
          measure_label: '12 PIES',
          total_available_quantity: '60.000',
          total_initial_quantity: '60.000',
          total_batches: 1,
        },
      ]);
    });
  });

  describe('formatMeasureTotalsLabel', () => {
    it('joins size labels for excel', () => {
      expect(
        formatMeasureTotalsLabel([
          {
            measure: '8',
            measure_uom_id: 'foot',
            measure_uom_name: 'Foot',
            measure_label: '8 Foot',
            total_available_quantity: '120.000',
            total_initial_quantity: '120.000',
            total_batches: 1,
          },
          {
            measure: '12',
            measure_uom_id: 'pies',
            measure_uom_name: 'PIES',
            measure_label: '12 PIES',
            total_available_quantity: '80.000',
            total_initial_quantity: '80.000',
            total_batches: 1,
          },
        ]),
      ).toBe('8 Foot → 120.000 · 12 PIES → 80.000');
    });
  });
});
