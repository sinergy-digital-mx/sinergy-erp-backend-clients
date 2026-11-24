import {
  explainConfigurationOnly,
  explainLotAverage,
  pickMarginPriceOption,
  resolveLotMargin,
  resolvePurchaseUnitCost,
  MarginSnapshot,
} from './inventory-margin.util';

function lot(label: string, margin: MarginSnapshot, detail: string | null = null) {
  return { label, detail, margin };
}

describe('inventory margin', () => {
  const price = { amount: 48.5, listName: 'General' };

  it('uses landed MXN cost and ignores the vendor amount', () => {
    const resolved = resolvePurchaseUnitCost({
      hasPurchase: true,
      folio: 'ODC-1',
      currency: 'USD',
      vendorUnitCost: 1.8,
      realUnitCostMxn: 32.231,
      originalQuantity: 10,
      convertedQuantity: 5,
      customsExchangeRate: 17,
    });
    expect(resolved.cost).toBe(32.231);
    expect(resolved.basis).toBe('landed_mxn');
    expect(resolved.scaled).toBe(false);
  });

  it('scales a MXN vendor cost into the inventory unit', () => {
    const resolved = resolvePurchaseUnitCost({
      hasPurchase: true,
      folio: 'ODC-2',
      currency: 'MXN',
      vendorUnitCost: 10,
      realUnitCostMxn: null,
      originalQuantity: 10,
      convertedQuantity: 5,
      customsExchangeRate: null,
    });
    expect(resolved.cost).toBe(20);
    expect(resolved.basis).toBe('vendor_mxn');
    expect(resolved.scaled).toBe(true);
  });

  it('converts a USD vendor cost with the customs rate', () => {
    const resolved = resolvePurchaseUnitCost({
      hasPurchase: true,
      folio: 'ODC-3',
      currency: 'USD',
      vendorUnitCost: 2,
      realUnitCostMxn: null,
      originalQuantity: null,
      convertedQuantity: null,
      customsExchangeRate: 18.5,
    });
    expect(resolved.cost).toBe(37);
    expect(resolved.basis).toBe('vendor_usd');
  });

  it('falls back to configuration when the purchase is USD without a rate', () => {
    const { margin, explanation } = resolveLotMargin(
      {
        hasPurchase: true,
        folio: 'ODC-4',
        currency: 'USD',
        vendorUnitCost: 2,
        realUnitCostMxn: null,
        originalQuantity: null,
        convertedQuantity: null,
        customsExchangeRate: null,
      },
      [{ vendorName: 'Aceros', uomName: 'Pieza', cost: 30, currency: 'MXN' }],
      price,
    );
    expect(margin.source).toBe('configuration');
    expect(margin.unit_cost).toBe('30.00');
    expect(margin.margin_amount).toBe('18.50');
    expect(margin.margin_percentage).toBe('38.14');
    expect(explanation.headline).toContain('costo configurado');
    expect(explanation.groups[0].lines[0].included).toBe(false);
  });

  it('averages MXN configuration costs and leaves USD out', () => {
    const { margin, explanation } = resolveLotMargin(
      null,
      [
        { vendorName: 'Uno', uomName: 'Pieza', cost: 20, currency: 'MXN' },
        { vendorName: 'Dos', uomName: 'Pieza', cost: 40, currency: 'MXN' },
        { vendorName: 'Tres', uomName: 'Pieza', cost: 5, currency: 'USD' },
      ],
      price,
    );
    expect(margin.source).toBe('configuration');
    expect(margin.source_label).toBe('Configuración');
    expect(margin.unit_cost).toBe('30.00');
    expect(margin.hint).toContain('Sin compra');
    const configGroup = explanation.groups.find((group) => group.title === 'Costo configurado');
    expect(configGroup?.lines.filter((line) => line.included)).toHaveLength(2);
    expect(configGroup?.lines.find((line) => line.currency === 'USD')?.included).toBe(false);
  });

  it('returns no margin when price and cost are missing', () => {
    const { margin } = resolveLotMargin(null, [], { amount: null, listName: null });
    expect(margin.source).toBe('none');
    expect(margin.unit_cost).toBeNull();
    expect(margin.unit_price).toBeNull();
    expect(margin.margin_percentage).toBeNull();
  });

  it('averages three lots, two purchases and one configuration', () => {
    const purchaseA = resolveLotMargin(
      {
        hasPurchase: true,
        folio: 'ODC-A',
        currency: 'MXN',
        vendorUnitCost: 20,
        realUnitCostMxn: null,
        originalQuantity: null,
        convertedQuantity: null,
        customsExchangeRate: null,
      },
      [],
      price,
    ).margin;
    const purchaseB = resolveLotMargin(
      {
        hasPurchase: true,
        folio: 'ODC-B',
        currency: 'MXN',
        vendorUnitCost: 30,
        realUnitCostMxn: null,
        originalQuantity: null,
        convertedQuantity: null,
        customsExchangeRate: null,
      },
      [],
      price,
    ).margin;
    const configured = resolveLotMargin(
      null,
      [{ vendorName: 'Import', uomName: 'Pieza', cost: 40, currency: 'MXN' }],
      price,
    ).margin;

    const explanation = explainLotAverage(
      [
        lot('L1', purchaseA, 'ODC-A'),
        lot('L2', purchaseB, 'ODC-B'),
        lot('L3', configured, 'Sin compra'),
      ],
      price,
      [{ vendorName: 'Import', uomName: 'Pieza', cost: 40, currency: 'MXN' }],
      'Promedio de los lotes con existencia en este almacén.',
    );

    expect(explanation.margin.source).toBe('mixed');
    expect(explanation.margin.source_label).toBe('Mixto');
    expect(explanation.margin.unit_cost).toBe('30.00');
    expect(explanation.margin.unit_price).toBe('48.50');
    expect(explanation.margin.margin_amount).toBe('18.50');
    expect(explanation.margin.purchase_count).toBe(2);
    expect(explanation.margin.configuration_count).toBe(1);
    expect(explanation.formula_sentence).toContain('(20.00 + 30.00 + 40.00) / 3 = 30.00');
    expect(explanation.groups.map((group) => group.title)).toEqual([
      'Compras',
      'Costo configurado',
    ]);
  });

  it('skips lots without cost when averaging', () => {
    const priced = resolveLotMargin(
      null,
      [{ vendorName: 'Uno', uomName: 'Pieza', cost: 10, currency: 'MXN' }],
      price,
    ).margin;
    const empty = resolveLotMargin(null, [], price).margin;
    const explanation = explainLotAverage(
      [lot('L1', priced), lot('L2', empty)],
      price,
      [],
      'Promedio de los lotes con existencia.',
    );
    expect(explanation.margin.unit_cost).toBe('10.00');
    expect(explanation.margin.missing_count).toBe(1);
    expect(explanation.margin.hint).toContain('1 lote sin costo');
  });

  it('explains a product that only has configuration and no stock', () => {
    const explanation = explainConfigurationOnly(
      [
        { vendorName: 'Uno', uomName: 'Pieza', cost: 12, currency: 'MXN' },
        { vendorName: 'Dos', uomName: 'Pieza', cost: 18, currency: 'MXN' },
      ],
      price,
      'Pieza',
    );
    expect(explanation.margin.source).toBe('configuration');
    expect(explanation.margin.unit_cost).toBe('15.00');
    expect(explanation.headline).toContain('No hay lotes');
    expect(explanation.margin.margin_amount).toBe('33.50');
  });

  it('uses the margin list when it has a price, otherwise the oldest', () => {
    const oldest = { name: 'Vieja', is_margin_default: false };
    const marked = { name: 'Marcada', is_margin_default: true };
    expect(pickMarginPriceOption([oldest, marked])?.name).toBe('Marcada');
    expect(pickMarginPriceOption([oldest])?.name).toBe('Vieja');
    expect(pickMarginPriceOption([])).toBeNull();
  });
});
