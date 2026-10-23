"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyOverdueBucket = emptyOverdueBucket;
exports.parseOverdueBucket = parseOverdueBucket;
exports.mergeOverdueBuckets = mergeOverdueBuckets;
exports.isInDownPaymentPhase = isInDownPaymentPhase;
exports.mapNextPaymentRow = mapNextPaymentRow;
exports.resolveListPaymentInsight = resolveListPaymentInsight;
exports.loadListPaymentInsightMaps = loadListPaymentInsightMaps;
exports.applyOverduePaymentsJoin = applyOverduePaymentsJoin;
exports.loadFilteredOverdueStats = loadFilteredOverdueStats;
const UNPAID_PAYMENT_STATUSES = ['pendiente', 'parcial', 'vencido'];
const OVERDUE_PAYMENT_STATUSES = ['pendiente', 'parcial'];
function emptyOverdueBucket() {
    return { contracts_count: 0, payments_count: 0, value: 0 };
}
function parseOverdueBucket(row) {
    return {
        contracts_count: parseInt(String(row?.contracts_count ?? 0), 10) || 0,
        payments_count: parseInt(String(row?.payments_count ?? 0), 10) || 0,
        value: parseFloat(String(row?.value ?? 0)) || 0,
    };
}
function mergeOverdueBuckets(contract, downPayment, uniqueContractsCount) {
    return {
        contracts_count: uniqueContractsCount,
        payments_count: contract.payments_count + downPayment.payments_count,
        value: Math.round((contract.value + downPayment.value) * 100) / 100,
        contract,
        down_payment: downPayment,
    };
}
function isInDownPaymentPhase(params) {
    if (!params.downPaymentFinanced) {
        return false;
    }
    if (params.unpaidDownPaymentCount > 0) {
        return true;
    }
    const target = Number(params.downPaymentTarget);
    if (!Number.isFinite(target) || target <= 0) {
        return true;
    }
    return Number(params.downPaymentApplied) < target;
}
function mapNextPaymentRow(row) {
    if (!row) {
        return null;
    }
    const amount = row.status === 'parcial'
        ? Number(row.amount_pending)
        : Number(row.amount);
    return {
        due_date: row.due_date ?? null,
        status: row.status ?? null,
        payment_number: row.payment_number ?? null,
        amount: Number.isFinite(amount) ? amount : null,
    };
}
function resolveListPaymentInsight(params) {
    const inDownPayment = isInDownPaymentPhase(params);
    const useDownPayment = !!params.downPaymentNext;
    const nextPayment = useDownPayment
        ? params.downPaymentNext
        : params.contractNext;
    return {
        payment_phase: inDownPayment ? 'down_payment' : 'contract',
        next_payment_kind: nextPayment
            ? useDownPayment
                ? 'down_payment'
                : 'contract'
            : null,
        next_payment_is_last_down_payment: useDownPayment && params.unpaidDownPaymentCount === 1,
        next_payment: nextPayment,
    };
}
async function loadListPaymentInsightMaps(manager, tenantId, contractIds) {
    const empty = {
        contractNext: new Map(),
        downPaymentNext: new Map(),
        unpaidDownCount: new Map(),
        overdueContractCount: new Map(),
        overdueDownCount: new Map(),
    };
    if (contractIds.length === 0) {
        return empty;
    }
    const placeholders = contractIds.map(() => '?').join(',');
    const [contractNextRows, downPaymentNextRows, unpaidDownRows, overdueContractRows, overdueDownRows] = await Promise.all([
        manager.query(`
        SELECT p.contract_id, p.due_date, p.status, p.payment_number, p.amount, p.amount_pending
        FROM contract_payments p
        INNER JOIN (
          SELECT contract_id, MIN(due_date) as next_due_date
          FROM contract_payments
          WHERE contract_id IN (${placeholders})
            AND tenant_id = ?
            AND status IN (?, ?, ?)
          GROUP BY contract_id
        ) next_p ON p.contract_id = next_p.contract_id AND p.due_date = next_p.next_due_date
        WHERE p.tenant_id = ?
          AND p.status IN (?, ?, ?)
        ORDER BY p.is_overdue DESC, p.due_date ASC
        `, [
            ...contractIds,
            tenantId,
            ...UNPAID_PAYMENT_STATUSES,
            tenantId,
            ...UNPAID_PAYMENT_STATUSES,
        ]),
        manager.query(`
        SELECT p.contract_id, p.due_date, p.status, p.payment_number, p.amount, p.amount_pending
        FROM contract_downpayment_payments p
        INNER JOIN (
          SELECT contract_id, MIN(due_date) as next_due_date
          FROM contract_downpayment_payments
          WHERE contract_id IN (${placeholders})
            AND tenant_id = ?
            AND status IN (?, ?)
          GROUP BY contract_id
        ) next_p ON p.contract_id = next_p.contract_id AND p.due_date = next_p.next_due_date
        WHERE p.tenant_id = ?
          AND p.status IN (?, ?)
        ORDER BY p.is_overdue DESC, p.due_date ASC
        `, [
            ...contractIds,
            tenantId,
            ...OVERDUE_PAYMENT_STATUSES,
            tenantId,
            ...OVERDUE_PAYMENT_STATUSES,
        ]),
        manager.query(`
        SELECT contract_id, COUNT(*) as unpaid_count
        FROM contract_downpayment_payments
        WHERE contract_id IN (${placeholders})
          AND tenant_id = ?
          AND status IN (?, ?)
        GROUP BY contract_id
        `, [...contractIds, tenantId, ...OVERDUE_PAYMENT_STATUSES]),
        manager.query(`
        SELECT contract_id, COUNT(*) as overdue_count
        FROM contract_payments
        WHERE contract_id IN (${placeholders})
          AND tenant_id = ?
          AND payment_date < CURDATE()
          AND status IN (?, ?)
        GROUP BY contract_id
        `, [...contractIds, tenantId, ...OVERDUE_PAYMENT_STATUSES]),
        manager.query(`
        SELECT contract_id, COUNT(*) as overdue_count
        FROM contract_downpayment_payments
        WHERE contract_id IN (${placeholders})
          AND tenant_id = ?
          AND due_date < CURDATE()
          AND status IN (?, ?)
        GROUP BY contract_id
        `, [...contractIds, tenantId, ...OVERDUE_PAYMENT_STATUSES]),
    ]);
    const toCandidateMap = (rows) => {
        const map = new Map();
        rows.forEach((row) => {
            const mapped = mapNextPaymentRow(row);
            if (mapped && !map.has(row.contract_id)) {
                map.set(row.contract_id, mapped);
            }
        });
        return map;
    };
    const toCountMap = (rows, key) => {
        const map = new Map();
        rows.forEach((row) => {
            map.set(row.contract_id, parseInt(String(row[key] ?? 0), 10) || 0);
        });
        return map;
    };
    return {
        contractNext: toCandidateMap(contractNextRows),
        downPaymentNext: toCandidateMap(downPaymentNextRows),
        unpaidDownCount: toCountMap(unpaidDownRows, 'unpaid_count'),
        overdueContractCount: toCountMap(overdueContractRows, 'overdue_count'),
        overdueDownCount: toCountMap(overdueDownRows, 'overdue_count'),
    };
}
function applyOverduePaymentsJoin(query, table, alias, dateColumn, statusesParam = 'overduePaymentStatuses') {
    return query.leftJoin(table, alias, `${alias}.contract_id = c.id AND ${alias}.${dateColumn} < CURDATE() AND ${alias}.status IN (:...${statusesParam})`, { [statusesParam]: OVERDUE_PAYMENT_STATUSES });
}
async function loadFilteredOverdueStats(baseQuery) {
    const selectOverdue = (query, alias) => query
        .andWhere('c.status = :overdueContractStatus', {
        overdueContractStatus: 'activo',
    })
        .andWhere(`${alias}.id IS NOT NULL`)
        .select('COUNT(DISTINCT c.id)', 'contracts_count')
        .addSelect(`COUNT(${alias}.id)`, 'payments_count')
        .addSelect(`SUM(CASE WHEN ${alias}.status = "parcial" THEN ${alias}.amount_pending ELSE ${alias}.amount END)`, 'value');
    const contractQuery = applyOverduePaymentsJoin(baseQuery(), 'contract_payments', 'overdue_p', 'payment_date');
    const downPaymentQuery = applyOverduePaymentsJoin(baseQuery(), 'contract_downpayment_payments', 'overdue_d', 'due_date');
    const uniqueQuery = applyOverduePaymentsJoin(applyOverduePaymentsJoin(baseQuery(), 'contract_payments', 'overdue_p', 'payment_date', 'overdueContractStatuses'), 'contract_downpayment_payments', 'overdue_d', 'due_date', 'overdueDownStatuses')
        .andWhere('c.status = :overdueContractStatus', {
        overdueContractStatus: 'activo',
    })
        .andWhere('(overdue_p.id IS NOT NULL OR overdue_d.id IS NOT NULL)')
        .select('COUNT(DISTINCT c.id)', 'contracts_count');
    const [contractRow, downPaymentRow, uniqueRow] = await Promise.all([
        selectOverdue(contractQuery, 'overdue_p').getRawOne(),
        selectOverdue(downPaymentQuery, 'overdue_d').getRawOne(),
        uniqueQuery.getRawOne(),
    ]);
    const contract = parseOverdueBucket(contractRow);
    const downPayment = parseOverdueBucket(downPaymentRow);
    return mergeOverdueBuckets(contract, downPayment, parseInt(String(uniqueRow?.contracts_count ?? 0), 10) || 0);
}
//# sourceMappingURL=contract-list-insight.util.js.map