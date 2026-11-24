"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectVisibleBranchIds = selectVisibleBranchIds;
exports.orderBranchRows = orderBranchRows;
exports.buildBranchStockReport = buildBranchStockReport;
const inventory_margin_util_1 = require("./inventory-margin.util");
function selectVisibleBranchIds(branchIds, savedIds) {
    if (!savedIds || savedIds.length === 0) {
        return branchIds;
    }
    const known = new Set(branchIds);
    const picked = [];
    const seen = new Set();
    for (const id of savedIds) {
        if (!known.has(id) || seen.has(id))
            continue;
        seen.add(id);
        picked.push(id);
    }
    return picked.length > 0 ? picked : branchIds;
}
function orderBranchRows(branches, orderIds) {
    if (!orderIds || orderIds.length === 0)
        return branches;
    const rank = new Map();
    orderIds.forEach((id, index) => {
        if (!rank.has(id))
            rank.set(id, index);
    });
    return [...branches].sort((left, right) => {
        const leftRank = rank.get(left.id);
        const rightRank = rank.get(right.id);
        if (leftRank == null && rightRank == null)
            return 0;
        if (leftRank == null)
            return 1;
        if (rightRank == null)
            return -1;
        return leftRank - rightRank;
    });
}
function formatQty(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return safe.toFixed(3);
}
function uomKey(name) {
    return (name ?? '').trim().toLocaleLowerCase('es');
}
function buildBranchStockReport(branches, lots) {
    const buckets = new Map();
    for (const branch of branches) {
        buckets.set(`${branch.id}|`, {
            branch,
            uomName: null,
            quantity: 0,
            pricedQuantity: 0,
            pricedCost: 0,
        });
    }
    for (const lot of lots) {
        const branch = branches.find((item) => item.id === lot.billing_branch_id);
        if (!branch)
            continue;
        const quantity = Number.isFinite(lot.quantity) && lot.quantity > 0 ? lot.quantity : 0;
        if (quantity <= 0)
            continue;
        const name = lot.uom_name?.trim() || null;
        const key = `${branch.id}|${uomKey(name)}`;
        const emptyKey = `${branch.id}|`;
        let bucket = buckets.get(key);
        if (!bucket) {
            const placeholder = buckets.get(emptyKey);
            if (placeholder && placeholder.quantity === 0 && placeholder.uomName == null) {
                buckets.delete(emptyKey);
                bucket = { ...placeholder, uomName: name };
            }
            else {
                bucket = {
                    branch,
                    uomName: name,
                    quantity: 0,
                    pricedQuantity: 0,
                    pricedCost: 0,
                };
            }
            buckets.set(key, bucket);
        }
        bucket.quantity += quantity;
        const cost = lot.unit_cost;
        if (cost != null && Number.isFinite(cost) && cost >= 0) {
            bucket.pricedQuantity += quantity;
            bucket.pricedCost += quantity * cost;
        }
    }
    const branchRank = new Map(branches.map((branch, index) => [branch.id, index]));
    const lines = [...buckets.values()]
        .map((bucket) => toLine(bucket))
        .sort((left, right) => {
        const byBranch = (branchRank.get(left.billing_branch_id) ?? 0) - (branchRank.get(right.billing_branch_id) ?? 0);
        if (byBranch !== 0)
            return byBranch;
        return (left.uom_name ?? '').localeCompare(right.uom_name ?? '', 'es');
    });
    const stockedUoms = new Set(lines
        .filter((line) => Number(line.quantity) > 0)
        .map((line) => uomKey(line.uom_name)));
    const mixed = stockedUoms.size > 1;
    const singleUom = stockedUoms.size === 1
        ? lines.find((line) => Number(line.quantity) > 0)?.uom_name ?? null
        : null;
    const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
    const costComplete = lines.every((line) => line.cost_complete);
    const knownTotals = lines
        .map((line) => (line.total_cost == null ? null : Number(line.total_cost)))
        .filter((value) => value != null);
    const totalCost = !mixed && costComplete && knownTotals.length === lines.length
        ? knownTotals.reduce((sum, value) => sum + value, 0)
        : null;
    const average = !mixed && totalQuantity > 0 && totalCost != null
        ? totalCost / totalQuantity
        : !mixed && totalQuantity === 0
            ? 0
            : null;
    return {
        uom_name: mixed ? null : singleUom,
        mixed_uom: mixed,
        total_quantity: mixed ? null : formatQty(totalQuantity),
        average_unit_cost: average == null ? null : (0, inventory_margin_util_1.formatMarginAmount)(average),
        total_cost: totalCost == null ? null : (0, inventory_margin_util_1.formatMarginAmount)(totalCost),
        cost_complete: !mixed && costComplete,
        lines,
    };
}
function toLine(bucket) {
    const complete = bucket.quantity <= 0 || bucket.pricedQuantity + 1e-9 >= bucket.quantity;
    const average = bucket.pricedQuantity > 0 ? bucket.pricedCost / bucket.pricedQuantity : bucket.quantity <= 0 ? 0 : null;
    const total = bucket.quantity <= 0
        ? 0
        : complete && average != null
            ? average * bucket.quantity
            : bucket.pricedQuantity > 0
                ? bucket.pricedCost
                : null;
    return {
        billing_branch_id: bucket.branch.id,
        name: bucket.branch.name,
        city: bucket.branch.city,
        razon_social: bucket.branch.razon_social,
        uom_name: bucket.uomName,
        quantity: formatQty(bucket.quantity),
        average_unit_cost: average == null ? null : (0, inventory_margin_util_1.formatMarginAmount)(average),
        total_cost: total == null ? null : (0, inventory_margin_util_1.formatMarginAmount)(total),
        cost_complete: complete,
    };
}
//# sourceMappingURL=branch-stock-report.util.js.map