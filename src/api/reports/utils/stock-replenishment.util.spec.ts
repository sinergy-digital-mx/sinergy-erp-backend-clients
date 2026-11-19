import {
  buildReplenishmentPlan,
  needsTransferHint,
  resolveAveragePrice,
  roundQtyUp,
  safetyDaysFor,
  stockDifference,
  toCostMxn,
} from './stock-replenishment.util';

describe('pronóstico de existencias', () => {
  const base = {
    onHand: 0,
    soldQty: 30,
    previousSoldQty: 30,
    periodDays: 30,
    coverDays: 30,
    averagePrice: 100,
    unitCost: 60,
  };

  it('usa 8 días de seguridad cuando se cubren 30', () => {
    expect(safetyDaysFor(30)).toBe(8);
    expect(safetyDaysFor(15)).toBe(4);
    expect(safetyDaysFor(60)).toBe(15);
  });

  it('no recomienda comprar si el producto no se vendió', () => {
    const plan = buildReplenishmentPlan({ ...base, soldQty: 0, previousSoldQty: 0, onHand: 12 });
    expect(plan.status).toBe('no_movement');
    expect(plan.recommendedQty).toBe(0);
    expect(plan.minStock).toBe(0);
    expect(plan.maxStock).toBe(0);
  });

  it('pide reponer hasta el máximo cuando la existencia está bajo el mínimo', () => {
    const plan = buildReplenishmentPlan({ ...base, onHand: 2 });
    expect(plan.dailyRate).toBe(1);
    expect(plan.minStock).toBe(8);
    expect(plan.maxStock).toBe(30);
    expect(plan.status).toBe('reorder');
    expect(plan.recommendedQty).toBe(28);
    expect(plan.unitMargin).toBe(40);
    expect(plan.marginPercent).toBe(40);
  });

  it('completa el máximo cuando la existencia está entre mínimo y máximo', () => {
    const plan = buildReplenishmentPlan({ ...base, onHand: 10 });
    expect(plan.status).toBe('fill');
    expect(plan.recommendedQty).toBe(20);
  });

  it('no compra cuando la existencia ya cubre el máximo', () => {
    expect(buildReplenishmentPlan({ ...base, onHand: 30 }).status).toBe('healthy');
    expect(buildReplenishmentPlan({ ...base, onHand: 30 }).recommendedQty).toBe(0);
    expect(buildReplenishmentPlan({ ...base, onHand: 40 }).status).toBe('overstock');
  });

  it('si está agotado recomienda el máximo, y si la existencia es negativa suma el faltante', () => {
    expect(buildReplenishmentPlan({ ...base, onHand: 0 }).recommendedQty).toBe(30);
    expect(buildReplenishmentPlan({ ...base, onHand: 0 }).status).toBe('out');
    expect(buildReplenishmentPlan({ ...base, onHand: -5 }).recommendedQty).toBe(35);
  });

  it('sube la recomendación cuando las ventas van al alza', () => {
    const flat = buildReplenishmentPlan({ ...base, onHand: 0 });
    const rising = buildReplenishmentPlan({ ...base, onHand: 0, previousSoldQty: 20 });
    expect(rising.trend).toBe('up');
    expect(rising.trendFactor).toBe(1.5);
    expect(rising.maxStock).toBe(45);
    expect(rising.recommendedQty).toBeGreaterThan(flat.recommendedQty);
  });

  it('baja la recomendación cuando las ventas van a la baja, sin pasar de 75%', () => {
    const falling = buildReplenishmentPlan({ ...base, onHand: 0, previousSoldQty: 80 });
    expect(falling.trend).toBe('down');
    expect(falling.trendFactor).toBe(0.75);
    expect(falling.maxStock).toBe(22.5);
  });

  it('deja la utilidad vacía si no hay precio', () => {
    const plan = buildReplenishmentPlan({ ...base, averagePrice: null, unitCost: 60 });
    expect(plan.unitMargin).toBeNull();
    expect(plan.marginPercent).toBeNull();
  });

  it('prioriza el precio promedio de lo vendido y si no, el de lista', () => {
    expect(resolveAveragePrice(10, 250, 40)).toEqual({ price: 25, source: 'sales' });
    expect(resolveAveragePrice(0, 0, 40)).toEqual({ price: 40, source: 'list' });
    expect(resolveAveragePrice(0, 0, null).source).toBe('none');
  });

  it('convierte el costo en dólares con el tipo de cambio', () => {
    expect(toCostMxn(10, 'USD', 18.5)).toBe(185);
    expect(toCostMxn(10, 'USD', null)).toBeNull();
    expect(toCostMxn(12.5, 'MXN', null)).toBe(12.5);
  });

  it('redondea cantidades hacia arriba a 3 decimales y calcula la diferencia', () => {
    expect(roundQtyUp(1.0004)).toBe(1.001);
    expect(roundQtyUp(2)).toBe(2);
    expect(roundQtyUp(0)).toBe(0);
    expect(stockDifference(8, 10)).toBe(-2);
  });

  it('avisa traspaso cuando una sucursal está corta y el total alcanza', () => {
    expect(needsTransferHint(true, 0, 20, 10)).toBe(true);
    expect(needsTransferHint(true, 4, 20, 10)).toBe(false);
    expect(needsTransferHint(false, 0, 20, 10)).toBe(false);
  });
});
