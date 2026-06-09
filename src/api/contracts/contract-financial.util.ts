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

/** Meta de enganche para amortización (no el abonado acumulado). */
export function getDownPaymentTarget(contract: ContractFinancialFields): number {
  if (contract.down_payment_financed) {
    return Number(contract.down_payment_target ?? 0);
  }
  return Number(contract.down_payment ?? 0);
}

/** Enganche abonado hasta la fecha (campo down_payment en contratos financiados). */
export function getDownPaymentApplied(contract: Pick<Contract, 'down_payment'>): number {
  return Number(contract.down_payment ?? 0);
}

export function computeFinancedAmount(
  totalPrice: number,
  contract: ContractFinancialFields,
): number {
  const baseline = getDownPaymentTarget(contract);
  return Math.round((totalPrice - baseline) * 100) / 100;
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
