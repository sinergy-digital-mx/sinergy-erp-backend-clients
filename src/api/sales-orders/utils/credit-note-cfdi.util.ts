import {
  ADVANCE_SAT_CLAVE,
  ADVANCE_UNIT_CODE,
  ADVANCE_UNIT_NAME,
  AdvanceParty,
  BuiltCfdiAmounts,
  buildAdvanceConceptCfdi,
} from '../../electronic-invoicing/utils/advance-cfdi.util';
import {
  baseFromInclusiveTotal,
  CREDIT_NOTE_RELATION_TYPE,
  roundCreditMoney,
} from './credit-note.util';

export interface SalesCreditNoteCfdiInput {
  series?: string | null;
  folio: string;
  totalAmount: number;
  ivaPercentage: number;
  usoCfdi: string;
  formaPago: string;
  emisor: AdvanceParty;
  receptor: AdvanceParty;
  descripcion: string;
  relatedUuid: string;
  satClave?: string | null;
  unitCode?: string | null;
  unitName?: string | null;
  currency?: string | null;
  exchangeRate?: number | null;
}

export function buildSalesCreditNoteCfdi(input: SalesCreditNoteCfdiInput): BuiltCfdiAmounts {
  const totalAmount = roundCreditMoney(input.totalAmount);
  if (totalAmount <= 0) {
    throw new Error('El importe de la nota de crédito debe ser mayor a cero');
  }
  const currency = (input.currency || 'MXN').trim().toUpperCase() || 'MXN';
  const exchangeRate = Number(input.exchangeRate || 0);
  if (currency !== 'MXN' && !(exchangeRate > 0)) {
    throw new Error('La nota en dólares necesita el tipo de cambio de la orden');
  }
  const base = baseFromInclusiveTotal(totalAmount, input.ivaPercentage);
  const built = buildAdvanceConceptCfdi({
    series: input.series,
    folio: input.folio,
    baseAmount: base,
    ivaPercentage: input.ivaPercentage,
    usoCfdi: input.usoCfdi || 'G02',
    formaPago: input.formaPago || '15',
    metodoPago: 'PUE',
    emisor: input.emisor,
    receptor: input.receptor,
    tipoComprobante: 'E',
    descripcion: input.descripcion,
    relatedUuid: input.relatedUuid,
    relationType: CREDIT_NOTE_RELATION_TYPE,
    currency,
    exchangeRate: currency === 'MXN' ? null : exchangeRate,
    satClave: input.satClave || ADVANCE_SAT_CLAVE,
    unitCode: input.unitCode || ADVANCE_UNIT_CODE,
    unitName: input.unitName || ADVANCE_UNIT_NAME,
    identification: 'nota_credito',
  });
  if (Math.abs(built.total - totalAmount) > 0.009) {
    throw new Error('El importe de la nota no cuadra con el IVA de la factura');
  }
  return built;
}
