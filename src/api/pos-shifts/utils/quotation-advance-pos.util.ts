import { SalesOrderPosStage } from '../../../entities/sales-orders/sales-order-pos-stage.enum';

export function isQuotationAdvanceInCaja(
  posStage: string | null | undefined,
  advanceRequestedTotal?: number | null,
): boolean {
  const requested = Number(advanceRequestedTotal ?? 0);
  if (requested <= 0) {
    return false;
  }
  return posStage !== SalesOrderPosStage.Ventas;
}

export function getQuotationReturnToSalesBlockedReason(input: {
  generalStatus?: string | null;
  advanceRequestedTotal?: number | null;
  posStage?: string | null;
  hasVigenteAdvance?: boolean;
}): string | null {
  if (input.generalStatus !== 'Creada') {
    return 'La cotización ya no está pendiente de anticipo';
  }
  if (Number(input.advanceRequestedTotal ?? 0) <= 0) {
    return 'Esta cotización no tiene un anticipo por cobrar';
  }
  if (input.posStage === SalesOrderPosStage.Ventas) {
    return 'El anticipo ya está en ventas';
  }
  if (input.hasVigenteAdvance) {
    return 'Ese anticipo ya fue cobrado y timbrado';
  }
  return null;
}

export function getQuotationSendToCajaBlockedReason(input: {
  generalStatus?: string | null;
  posStage?: string | null;
  hasVigenteAdvance?: boolean;
}): string | null {
  if (input.generalStatus !== 'Creada') {
    return 'La cotización ya no se puede enviar a caja';
  }
  if (input.posStage !== SalesOrderPosStage.Ventas) {
    return 'La cotización no está en ventas';
  }
  if (input.hasVigenteAdvance) {
    return 'Ese anticipo ya fue cobrado y timbrado';
  }
  return null;
}
