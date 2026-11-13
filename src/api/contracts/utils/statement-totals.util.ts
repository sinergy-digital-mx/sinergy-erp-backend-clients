import {
  countActiveOverduePayments,
  roundPaymentMoney,
  sumActiveOverdueAmount,
} from './contract-payment-settlement.util';
import {
  LateInterestPaymentInput,
  resolveLateInterest,
  resolveLateInterestConfig,
} from './late-interest.util';

type OverduePayment = {
  status: string;
  is_overdue?: boolean;
  amount_pending?: number | string | null;
  amount?: number | string | null;
};

export interface StatementTotals {
  overdue_count: number;
  overdue_amount: number;
  late_interest_amount: number;
}

export function buildStatementTotals(input: {
  contract: {
    interest_rate?: number | string | null;
    payment_due_day?: number | string | null;
  };
  payments: Array<OverduePayment & LateInterestPaymentInput>;
  downpayments?: OverduePayment[];
  today?: Date;
}): StatementTotals {
  const rows = [...input.payments, ...(input.downpayments ?? [])];
  const config = resolveLateInterestConfig(input.contract);
  const lateInterest = input.payments.reduce(
    (sum, payment) =>
      sum + resolveLateInterest(payment, config, input.today).late_interest_amount,
    0,
  );
  return {
    overdue_count: countActiveOverduePayments(rows),
    overdue_amount: sumActiveOverdueAmount(rows),
    late_interest_amount: roundPaymentMoney(lateInterest),
  };
}
