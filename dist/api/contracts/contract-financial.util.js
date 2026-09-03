"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownPaymentTarget = getDownPaymentTarget;
exports.getDownPaymentApplied = getDownPaymentApplied;
exports.computeFinancedAmount = computeFinancedAmount;
exports.computeMonthlyPayment = computeMonthlyPayment;
exports.sumPaidFromPaymentRows = sumPaidFromPaymentRows;
exports.computeTotalPaid = computeTotalPaid;
exports.computeRemainingBalance = computeRemainingBalance;
exports.resolveContractFinancials = resolveContractFinancials;
exports.computeFinancingSnapshot = computeFinancingSnapshot;
function getDownPaymentTarget(contract) {
    if (contract.down_payment_financed) {
        return Number(contract.down_payment_target ?? 0);
    }
    return Number(contract.down_payment ?? 0);
}
function getDownPaymentApplied(contract) {
    return Number(contract.down_payment ?? 0);
}
function computeFinancedAmount(totalPrice, contract) {
    if (contract.down_payment_financed) {
        return Math.round(getDownPaymentTarget(contract) * 100) / 100;
    }
    const baseline = getDownPaymentTarget(contract);
    return Math.round((totalPrice - baseline) * 100) / 100;
}
function computeMonthlyPayment(totalPrice, contract, paymentMonths) {
    if (contract.down_payment_financed) {
        const target = getDownPaymentTarget(contract);
        if (target <= 0 || !Number.isFinite(paymentMonths) || paymentMonths < 1) {
            return 0;
        }
        return Math.round((target / paymentMonths) * 100) / 100;
    }
    const financed = computeFinancedAmount(totalPrice, contract);
    if (financed <= 0 || !Number.isFinite(paymentMonths) || paymentMonths < 1) {
        return 0;
    }
    return Math.round((financed / paymentMonths) * 100) / 100;
}
function sumPaidFromPaymentRows(payments) {
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
function computeTotalPaid(downPaymentApplied, monthlyPaymentsPaid) {
    return Math.round((downPaymentApplied + monthlyPaymentsPaid) * 100) / 100;
}
function computeRemainingBalance(totalPrice, downPaymentApplied, monthlyPaymentsPaid) {
    return Math.max(0, Math.round((totalPrice - downPaymentApplied - monthlyPaymentsPaid) * 100) / 100);
}
function resolveContractFinancials(contract, monthlyPaymentsPaid) {
    const totalPrice = Number(contract.total_price) || 0;
    const monthlyPaid = Math.round(monthlyPaymentsPaid * 100) / 100;
    if (contract.status === 'completado') {
        const target = getDownPaymentTarget(contract);
        const applied = getDownPaymentApplied(contract);
        const downPaymentApplied = target > 0
            ? Math.max(applied, target)
            : applied > 0
                ? applied
                : Math.max(0, Math.round((totalPrice - monthlyPaid) * 100) / 100);
        return {
            total_paid: totalPrice,
            total_paid_from_payments: Math.max(0, Math.round((totalPrice - downPaymentApplied) * 100) / 100),
            remaining_balance: 0,
            down_payment_applied: downPaymentApplied,
        };
    }
    const downPaymentApplied = getDownPaymentApplied(contract);
    return {
        total_paid: computeTotalPaid(downPaymentApplied, monthlyPaid),
        total_paid_from_payments: monthlyPaid,
        remaining_balance: computeRemainingBalance(totalPrice, downPaymentApplied, monthlyPaid),
        down_payment_applied: downPaymentApplied,
    };
}
function computeFinancingSnapshot(contract, monthlyPaymentsPaid = 0) {
    const totalPrice = Number(contract.total_price) || 0;
    const paymentMonths = Number(contract.payment_months) || 0;
    const downPaymentApplied = getDownPaymentApplied(contract);
    const remaining_balance = computeRemainingBalance(totalPrice, downPaymentApplied, monthlyPaymentsPaid);
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
//# sourceMappingURL=contract-financial.util.js.map