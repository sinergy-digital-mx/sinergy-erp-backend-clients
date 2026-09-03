import { roundUnitAmount } from '../../../common/utils/unit-amount.util';

/** Redondeo a 2 decimales para montos de OC (líneas y header). */
export function roundPoMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Costo unitario: hasta 4 decimales (p. ej. 2.215). */
export function roundPoUnitCost(value: number): number {
  return roundUnitAmount(value);
}

export interface RequestedLineBreakdown {
  line_subtotal: number;
  line_iva: number;
  line_ieps: number;
  line_total: number;
  iva_unit: number;
  ieps_unit: number;
}

export interface ReceivedLineBreakdown {
  received_line_subtotal: number;
  received_line_iva: number;
  received_line_ieps: number;
  received_line_total: number;
}

/**
 * Desglose solicitado: unit_total es costo sin impuestos.
 * line_subtotal = qty × unit_total (sin IVA/IEPS).
 * line_total = subtotal + IVA + IEPS.
 */
export function computeRequestedLineBreakdown(
  quantity: number,
  unitTotal: number,
  ivaPercentage: number,
  iepsPercentage: number,
): RequestedLineBreakdown {
  const qty = Number(quantity) || 0;
  const unit = roundPoUnitCost(unitTotal);
  const ivaPct = Number(ivaPercentage) || 0;
  const iepsPct = Number(iepsPercentage) || 0;
  const line_subtotal = roundPoMoney(qty * unit);
  const line_iva = roundPoMoney((line_subtotal * ivaPct) / 100);
  const line_ieps = roundPoMoney((line_subtotal * iepsPct) / 100);
  const line_total = roundPoMoney(line_subtotal + line_iva + line_ieps);
  const iva_unit = qty > 0 ? roundPoMoney(line_iva / qty) : 0;
  const ieps_unit = qty > 0 ? roundPoMoney(line_ieps / qty) : 0;

  return { line_subtotal, line_iva, line_ieps, line_total, iva_unit, ieps_unit };
}

export function computeReceivedLineBreakdown(
  quantity: number,
  unitTotal: number,
  ivaPercentage: number,
  iepsPercentage: number,
): ReceivedLineBreakdown {
  const requested = computeRequestedLineBreakdown(
    quantity,
    unitTotal,
    ivaPercentage,
    iepsPercentage,
  );
  return {
    received_line_subtotal: requested.line_subtotal,
    received_line_iva: requested.line_iva,
    received_line_ieps: requested.line_ieps,
    received_line_total: requested.line_total,
  };
}
