export type ContractSaleType = 'cash' | 'financed';

export type ContractSaleMark = 'cash' | 'down_payment_and_financing' | 'financing';

type SaleContract = {
  sale_type?: string | null;
  down_payment_financed?: boolean | null;
};

/** Solo `cash` es contado. Si el dato aún no llega, se trata como financiado. */
export function isCashContract(contract: SaleContract | null | undefined): boolean {
  return contract?.sale_type === 'cash';
}

export function resolveContractSaleMark(
  contract: SaleContract | null | undefined,
): ContractSaleMark {
  if (isCashContract(contract)) {
    return 'cash';
  }
  if (contract?.down_payment_financed) {
    return 'down_payment_and_financing';
  }
  return 'financing';
}

/** Texto de lista, detalle y Excel. */
export function contractSaleTypeLabel(contract: SaleContract | null | undefined): string {
  const mark = resolveContractSaleMark(contract);
  if (mark === 'cash') {
    return 'Contado';
  }
  if (mark === 'down_payment_and_financing') {
    return 'Financiado (E + F)';
  }
  return 'Financiado (F)';
}

export function contractSaleTypeHint(contract: SaleContract | null | undefined): string {
  const mark = resolveContractSaleMark(contract);
  if (mark === 'cash') {
    return 'Contado. Sin mensualidad. Los abonos, si se parten, van en enganche.';
  }
  if (mark === 'down_payment_and_financing') {
    return 'Enganche más financiamiento';
  }
  return 'Financiamiento';
}
