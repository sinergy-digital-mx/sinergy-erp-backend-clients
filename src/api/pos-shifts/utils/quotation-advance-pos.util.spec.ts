import { SalesOrderPosStage } from '../../../entities/sales-orders/sales-order-pos-stage.enum';
import {
  getQuotationReturnToSalesBlockedReason,
  getQuotationSendToCajaBlockedReason,
  isQuotationAdvanceInCaja,
} from './quotation-advance-pos.util';

describe('quotation-advance-pos.util', () => {
  describe('isQuotationAdvanceInCaja', () => {
    it('deja en caja los anticipos sin pos_stage (filas viejas)', () => {
      expect(isQuotationAdvanceInCaja(null, 100)).toBe(true);
    });

    it('saca de caja el anticipo regresado a ventas', () => {
      expect(isQuotationAdvanceInCaja(SalesOrderPosStage.Ventas, 100)).toBe(false);
    });

    it('no lista cotizaciones sin anticipo', () => {
      expect(isQuotationAdvanceInCaja(SalesOrderPosStage.Caja, 0)).toBe(false);
    });
  });

  describe('getQuotationReturnToSalesBlockedReason', () => {
    it('permite regresar un anticipo pendiente', () => {
      expect(
        getQuotationReturnToSalesBlockedReason({
          generalStatus: 'Creada',
          advanceRequestedTotal: 500,
          posStage: SalesOrderPosStage.Caja,
        }),
      ).toBeNull();
    });

    it('bloquea si ya se cobró', () => {
      expect(
        getQuotationReturnToSalesBlockedReason({
          generalStatus: 'Creada',
          advanceRequestedTotal: 500,
          hasVigenteAdvance: true,
        }),
      ).toBe('Ese anticipo ya fue cobrado y timbrado');
    });
  });

  describe('getQuotationSendToCajaBlockedReason', () => {
    it('solo reenvía desde ventas', () => {
      expect(
        getQuotationSendToCajaBlockedReason({
          generalStatus: 'Creada',
          posStage: SalesOrderPosStage.Caja,
        }),
      ).toBe('La cotización no está en ventas');
    });
  });
});
