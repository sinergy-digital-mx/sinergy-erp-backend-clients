"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundQty = roundQty;
exports.parseQty = parseQty;
exports.formatQty = formatQty;
exports.summarizeStock = summarizeStock;
function roundQty(value) {
    return parseFloat(value.toFixed(3));
}
function parseQty(value) {
    const parsed = parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? roundQty(parsed) : 0;
}
function formatQty(value) {
    const fixed = roundQty(value).toFixed(3);
    return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
function summarizeStock(lots) {
    const totals = new Map();
    let lotCount = 0;
    for (const lot of lots) {
        const qty = roundQty(lot.quantity);
        if (qty <= 0)
            continue;
        lotCount += 1;
        const key = lot.uomName.trim() || '—';
        totals.set(key, roundQty((totals.get(key) ?? 0) + qty));
    }
    const byUom = [...totals.entries()]
        .sort((left, right) => left[0].localeCompare(right[0], 'es'))
        .map(([uom_name, quantity]) => ({
        uom_name,
        quantity: formatQty(quantity),
    }));
    const totalQuantity = roundQty([...totals.values()].reduce((sum, quantity) => sum + quantity, 0));
    return { totalQuantity, lotCount, byUom };
}
//# sourceMappingURL=product-disable.util.js.map