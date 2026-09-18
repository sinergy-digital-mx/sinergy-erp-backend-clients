import { isPosStageInCaja, SalesOrderPosStage } from './sales-order-pos-stage.enum';

describe('isPosStageInCaja', () => {
  it('trata null y caja como pendientes de cobro', () => {
    expect(isPosStageInCaja(null)).toBe(true);
    expect(isPosStageInCaja(undefined)).toBe(true);
    expect(isPosStageInCaja(SalesOrderPosStage.Caja)).toBe(true);
  });

  it('excluye tickets reintegrados a ventas', () => {
    expect(isPosStageInCaja(SalesOrderPosStage.Ventas)).toBe(false);
    expect(isPosStageInCaja('ventas')).toBe(false);
  });
});
