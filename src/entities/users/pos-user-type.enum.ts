export enum PosUserType {
  VENTAS = 'VENTAS',
  COBRANZA = 'COBRANZA',
  /** Solo gerentes: menú de ventas y de cobranza. */
  AMBOS = 'AMBOS',
}

export const POS_SELL_TYPES: PosUserType[] = [
  PosUserType.VENTAS,
  PosUserType.AMBOS,
];

export const POS_COLLECT_TYPES: PosUserType[] = [
  PosUserType.COBRANZA,
  PosUserType.AMBOS,
];

export function canPosSell(type?: PosUserType | null): boolean {
  return type === PosUserType.VENTAS || type === PosUserType.AMBOS;
}

export function canPosCollect(type?: PosUserType | null): boolean {
  return type === PosUserType.COBRANZA || type === PosUserType.AMBOS;
}
