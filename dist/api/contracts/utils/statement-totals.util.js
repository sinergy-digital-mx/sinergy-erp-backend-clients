"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStatementTotals = buildStatementTotals;
const contract_payment_settlement_util_1 = require("./contract-payment-settlement.util");
const late_interest_util_1 = require("./late-interest.util");
function buildStatementTotals(input) {
    const rows = [...input.payments, ...(input.downpayments ?? [])];
    const config = (0, late_interest_util_1.resolveLateInterestConfig)(input.contract);
    const lateInterest = input.payments.reduce((sum, payment) => sum + (0, late_interest_util_1.resolveLateInterest)(payment, config, input.today).late_interest_amount, 0);
    return {
        overdue_count: (0, contract_payment_settlement_util_1.countActiveOverduePayments)(rows),
        overdue_amount: (0, contract_payment_settlement_util_1.sumActiveOverdueAmount)(rows),
        late_interest_amount: (0, contract_payment_settlement_util_1.roundPaymentMoney)(lateInterest),
    };
}
//# sourceMappingURL=statement-totals.util.js.map