export enum SalesOrderPosStage {
  Caja = 'caja',
  Ventas = 'ventas',
}

export function isPosStageInCaja(
  stage: string | null | undefined,
): boolean {
  return stage !== SalesOrderPosStage.Ventas;
}
