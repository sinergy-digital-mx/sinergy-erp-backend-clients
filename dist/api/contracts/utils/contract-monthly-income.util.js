"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMonthlyIncomeAnalysis = buildMonthlyIncomeAnalysis;
const contract_currency_util_1 = require("../contract-currency.util");
const MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];
function money(value) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return 0;
    return Math.round(n * 100) / 100;
}
function monthBounds(year, month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
}
function buildMonthlyIncomeAnalysis(input) {
    const { start, end } = monthBounds(input.year, input.month);
    const byContract = new Map();
    const touch = (row) => {
        const current = byContract.get(row.contract_id);
        if (current)
            return current;
        const created = {
            contract_id: row.contract_id,
            contract_number: row.contract_number,
            customer_name: (row.customer_name || '').trim() || 'Sin cliente',
            currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(row.currency),
            month_expected: 0,
            month_paid: 0,
            month_pending: 0,
            month_status: 'none',
            prior_amount: 0,
            prior_installments: 0,
            prior_oldest: null,
        };
        byContract.set(row.contract_id, created);
        return created;
    };
    for (const row of input.payments) {
        if (row.status === 'cancelado')
            continue;
        const due = String(row.due_date || '').slice(0, 10);
        if (!due)
            continue;
        const expected = money(row.amount);
        if (expected <= 0)
            continue;
        const paid = money(Math.min(expected, Math.max(0, Number(row.amount_paid) || 0)));
        const pending = money(expected - paid);
        const contract = touch(row);
        if (due >= start && due <= end) {
            contract.month_expected = money(contract.month_expected + expected);
            contract.month_paid = money(contract.month_paid + paid);
            contract.month_pending = money(contract.month_pending + pending);
            continue;
        }
        if (due < start && pending > 0) {
            contract.prior_amount = money(contract.prior_amount + pending);
            contract.prior_installments += 1;
            if (!contract.prior_oldest || due < contract.prior_oldest) {
                contract.prior_oldest = due;
            }
        }
    }
    const contracts = [...byContract.values()]
        .filter((row) => row.month_expected > 0 || row.prior_amount > 0)
        .map((row) => {
        let month_status = 'none';
        if (row.month_expected > 0) {
            if (row.month_pending <= 0)
                month_status = 'paid';
            else if (row.month_paid > 0)
                month_status = 'partial';
            else
                month_status = 'unpaid';
        }
        return { ...row, month_status };
    })
        .sort((a, b) => {
        if (b.month_pending !== a.month_pending)
            return b.month_pending - a.month_pending;
        if (b.prior_amount !== a.prior_amount)
            return b.prior_amount - a.prior_amount;
        return a.contract_number.localeCompare(b.contract_number, 'es');
    });
    const currencyCodes = [...new Set(contracts.map((row) => row.currency))];
    const currencies = currencyCodes.map((currency) => {
        const rows = contracts.filter((row) => row.currency === currency);
        const withMonth = rows.filter((row) => row.month_expected > 0);
        const expected = money(withMonth.reduce((sum, row) => sum + row.month_expected, 0));
        const collected = money(withMonth.reduce((sum, row) => sum + row.month_paid, 0));
        const pending = money(withMonth.reduce((sum, row) => sum + row.month_pending, 0));
        const priorRows = rows.filter((row) => row.prior_amount > 0);
        return {
            currency,
            expected,
            collected,
            pending,
            collection_pct: expected > 0 ? money((collected / expected) * 100) : 0,
            contracts: withMonth.length,
            paid_contracts: withMonth.filter((row) => row.month_status === 'paid').length,
            partial_contracts: withMonth.filter((row) => row.month_status === 'partial').length,
            unpaid_contracts: withMonth.filter((row) => row.month_status === 'unpaid').length,
            prior_only_contracts: rows.filter((row) => row.month_status === 'none').length,
            prior_amount: money(priorRows.reduce((sum, row) => sum + row.prior_amount, 0)),
            prior_installments: priorRows.reduce((sum, row) => sum + row.prior_installments, 0),
            prior_contracts: priorRows.length,
            average_installment: withMonth.length > 0 ? money(expected / withMonth.length) : 0,
        };
    });
    currencies.sort((a, b) => b.expected - a.expected || a.currency.localeCompare(b.currency));
    const unscheduled = (input.unscheduled ?? []).map((row) => ({
        contract_id: row.contract_id,
        contract_number: row.contract_number,
        customer_name: (row.customer_name || '').trim() || 'Sin cliente',
        currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(row.currency),
        monthly_payment: money(row.monthly_payment),
    }));
    return {
        year: input.year,
        month: input.month,
        month_label: `${MONTHS[input.month - 1]} ${input.year}`,
        currencies,
        contracts,
        unscheduled: {
            count: unscheduled.length,
            contracts: unscheduled,
        },
    };
}
//# sourceMappingURL=contract-monthly-income.util.js.map