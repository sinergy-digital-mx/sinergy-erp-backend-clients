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

/** Quien puede sentarse en caja con su código: caja, ventas o un vendedor de piso. */
export function canCoverPosCaja(user: {
  is_pos_user?: boolean | number | null;
  pos_user_type?: PosUserType | null;
}): boolean {
  const isPosTerminal = user.is_pos_user === true || user.is_pos_user === 1;
  if (!isPosTerminal) {
    return true;
  }
  return canPosSell(user.pos_user_type) || canPosCollect(user.pos_user_type);
}
