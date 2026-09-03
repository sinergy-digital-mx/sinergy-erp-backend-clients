/** Precio o costo unitario: hasta 4 decimales (p. ej. 2.150). No redondea a 2. */
export function roundUnitAmount(value: number): number {
  return Number((Number(value) || 0).toFixed(4));
}
