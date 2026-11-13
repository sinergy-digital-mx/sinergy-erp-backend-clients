import { Contract } from '../../entities/contracts/contract.entity';

type ContractFinancialFields = Pick<
  Contract,
  | 'down_payment'
  | 'down_payment_target'
  | 'down_payment_financed'
  | 'total_price'
  | 'payment_months'
  | 'status'
>;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveCreateDownPaymentTarget(params: {
  financed: boolean;
  downPayment?: number | null;
  downPaymentTarget?: number | null;
}): number | null {
  if (!params.financed) {
    return null;
  }
  const explicit = Number(params.downPaymentTarget);
  if (params.downPaymentTarget != null && Number.isFinite(explicit) && explicit > 0) {
    return roundMoney(explicit);
  }
  const fromDownPayment = Number(params.downPayment);
  if (Number.isFinite(fromDownPayment) && fromDownPayment > 0) {
    return roundMoney(fromDownPayment);
  }
  return null;
}

/** Meta de enganche (contrato normal) o base del plan mensual (enganche financiado). */
export function getDownPaymentTarget(contract: ContractFinancialFields): number {
  if (contract.down_payment_financed) {
    return Number(contract.down_payment_target ?? 0);
  }
  return Number(contract.down_payment ?? 0);
}

/**
 * Meta efectiva para cards de enganche: la guardada, o la suma de cuotas si aún no hay meta.
 * Devuelve null solo cuando no hay meta ni cuotas (la UI muestra “Sin definir”).
 */
export function resolveEffectiveDownPaymentTarget(
  savedTarget: number | null | undefined,
  scheduledTotal: number,
): number | null {
  const target = Number(savedTarget);
  if (Number.isFinite(target) && target > 0) {
    return roundMoney(target);
  }
  const scheduled = Number(scheduledTotal);
  if (Number.isFinite(scheduled) && scheduled > 0) {
    return roundMoney(scheduled);
  }
  return null;
}

/** Saldo contra la meta. Siempre número; 0 si no hay meta. */
export function computeDownPaymentRemaining(
  effectiveTarget: number | null | undefined,
  applied: number,
): number {
  const target = Number(effectiveTarget);
  const appliedAmount = Number(applied);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const safeApplied = Number.isFinite(appliedAmount) ? appliedAmount : 0;
  return Math.max(0, roundMoney(safeTarget - safeApplied));
}

/** Enganche abonado hasta la fecha (campo down_payment en contratos financiados). */
export function getDownPaymentApplied(contract: Pick<Contract, 'down_payment'>): number {
  return Number(contract.down_payment ?? 0);
}

export function computeFinancedAmount(
  totalPrice: number,
  contract: ContractFinancialFields,
): number {
  if (contract.down_payment_financed && getDownPaymentTarget(contract) <= 0) {
    return 0;
  }
  const baseline = getDownPaymentTarget(contract);
  return Math.max(0, Math.round((totalPrice - baseline) * 100) / 100);
}

export function computeMonthlyPayment(
  totalPrice: number,
  contract: ContractFinancialFields,
  paymentMonths: number,
): number {
  const financed = computeFinancedAmount(totalPrice, contract);
  if (financed <= 0 || !Number.isFinite(paymentMonths) || paymentMonths < 1) {
    return 0;
  }
  return Math.round((financed / paymentMonths) * 100) / 100;
}

export function buildInstallmentAmounts(balance: number, months: number): number[] {
  const count = Math.max(0, Math.floor(months));
  if (count < 1) {
    return [];
  }
  const total = Math.max(0, Math.round(balance * 100) / 100);
  if (total <= 0) {
    return Array.from({ length: count }, () => 0);
  }
  const base = Math.round((total / count) * 100) / 100;
  const amounts = Array.from({ length: count }, () => base);
  const allocated = Math.round(base * (count - 1) * 100) / 100;
  amounts[count - 1] = Math.round((total - allocated) * 100) / 100;
  return amounts;
}

export function sumPaidFromPaymentRows(
  payments: Array<{ status: string; amount?: number | string | null; amount_paid?: number | string | null }>,
): number {
  return payments.reduce((sum, payment) => {
    if (payment.status === 'pagado') {
      return sum + Number(payment.amount || 0);
    }
    if (payment.status === 'parcial') {
      return sum + Number(payment.amount_paid || 0);
    }
    return sum;
  }, 0);
}

export function computeTotalPaid(
  downPaymentApplied: number,
  monthlyPaymentsPaid: number,
): number {
  return Math.round((downPaymentApplied + monthlyPaymentsPaid) * 100) / 100;
}

export function computeRemainingBalance(
  totalPrice: number,
  downPaymentApplied: number,
  monthlyPaymentsPaid: number,
): number {
  return Math.max(
    0,
    Math.round((totalPrice - downPaymentApplied - monthlyPaymentsPaid) * 100) / 100,
  );
}

/** Contratos completados se tratan como 100% pagados en listados y detalle. */
export function resolveContractFinancials(
  contract: ContractFinancialFields,
  monthlyPaymentsPaid: number,
): {
  total_paid: number;
  total_paid_from_payments: number;
  remaining_balance: number;
  down_payment_applied: number;
} {
  const totalPrice = Number(contract.total_price) || 0;
  const monthlyPaid = Math.round(monthlyPaymentsPaid * 100) / 100;

  if (contract.status === 'completado') {
    const target = getDownPaymentTarget(contract);
    const applied = getDownPaymentApplied(contract);
    const downPaymentApplied =
      target > 0
        ? Math.max(applied, target)
        : applied > 0
          ? applied
          : Math.max(0, Math.round((totalPrice - monthlyPaid) * 100) / 100);

    return {
      total_paid: totalPrice,
      total_paid_from_payments: Math.max(
        0,
        Math.round((totalPrice - downPaymentApplied) * 100) / 100,
      ),
      remaining_balance: 0,
      down_payment_applied: downPaymentApplied,
    };
  }

  const downPaymentApplied = getDownPaymentApplied(contract);

  return {
    total_paid: computeTotalPaid(downPaymentApplied, monthlyPaid),
    total_paid_from_payments: monthlyPaid,
    remaining_balance: computeRemainingBalance(
      totalPrice,
      downPaymentApplied,
      monthlyPaid,
    ),
    down_payment_applied: downPaymentApplied,
  };
}

export function computeFinancingSnapshot(
  contract: ContractFinancialFields,
  monthlyPaymentsPaid = 0,
): {
  remaining_balance: number;
  payment_months: number;
  monthly_payment: number;
} {
  const totalPrice = Number(contract.total_price) || 0;
  const paymentMonths = Number(contract.payment_months) || 0;
  const downPaymentApplied = getDownPaymentApplied(contract);
  const remaining_balance = computeRemainingBalance(
    totalPrice,
    downPaymentApplied,
    monthlyPaymentsPaid,
  );

  if (remaining_balance <= 0) {
    return {
      remaining_balance: 0,
      payment_months: paymentMonths,
      monthly_payment: 0,
    };
  }

  if (paymentMonths < 1) {
    return {
      remaining_balance,
      payment_months: 0,
      monthly_payment: 0,
    };
  }

  return {
    remaining_balance,
    payment_months: paymentMonths,
    monthly_payment: computeMonthlyPayment(totalPrice, contract, paymentMonths),
  };
}
