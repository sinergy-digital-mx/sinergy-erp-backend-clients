"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMeasure = formatMeasure;
exports.normalizeMeasure = normalizeMeasure;
exports.formatMeasureLabel = formatMeasureLabel;
exports.mapBatchMeasure = mapBatchMeasure;
exports.buildMeasureTotals = buildMeasureTotals;
exports.formatMeasureTotalsLabel = formatMeasureTotalsLabel;
function parseQty(value) {
    const parsed = parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? parsed : 0;
}
function cleanName(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const name = value.trim();
    return name || null;
}
function formatMeasure(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return String(Number(parsed.toFixed(3)));
}
function normalizeMeasure(value) {
    const formatted = formatMeasure(value);
    if (formatted === null) {
        return null;
    }
    return Number(formatted);
}
function formatMeasureLabel(measure, uomName) {
    const size = formatMeasure(measure);
    if (!size) {
        return null;
    }
    const name = cleanName(uomName);
    return name ? `${size} ${name}` : size;
}
function mapBatchMeasure(batch) {
    const measure = formatMeasure(batch.measure);
    if (!measure) {
        return {
            measure: null,
            measure_uom_id: null,
            measure_uom_name: null,
            measure_label: null,
        };
    }
    const measure_uom_id = (typeof batch.measure_uom_id === 'string' && batch.measure_uom_id) ||
        batch.measure_uom?.id ||
        null;
    const measure_uom_name = cleanName(batch.measure_uom_name) ?? cleanName(batch.measure_uom?.name);
    return {
        measure,
        measure_uom_id,
        measure_uom_name,
        measure_label: formatMeasureLabel(measure, measure_uom_name),
    };
}
function formatQty(value) {
    return (Number.isFinite(value) ? value : 0).toFixed(3);
}
function buildMeasureTotals(batches) {
    const mapped = batches.map((batch) => ({
        fields: mapBatchMeasure(batch),
        available: parseQty(batch.available_quantity),
        initial: parseQty(batch.initial_quantity),
    }));
    const hasAny = mapped.some((row) => row.fields.measure !== null);
    if (!hasAny) {
        return [];
    }
    const groups = new Map();
    for (const row of mapped) {
        const key = row.fields.measure
            ? `${row.fields.measure}|${row.fields.measure_uom_id ?? ''}`
            : '__none__';
        const existing = groups.get(key) ?? {
            fields: row.fields,
            available: 0,
            initial: 0,
            count: 0,
        };
        existing.available += row.available;
        existing.initial += row.initial;
        existing.count += 1;
        groups.set(key, existing);
    }
    return [...groups.values()]
        .sort((a, b) => {
        if (a.fields.measure === null)
            return 1;
        if (b.fields.measure === null)
            return -1;
        const sizeDiff = Number(a.fields.measure) - Number(b.fields.measure);
        if (sizeDiff !== 0)
            return sizeDiff;
        return (a.fields.measure_uom_name ?? '').localeCompare(b.fields.measure_uom_name ?? '');
    })
        .map((row) => ({
        measure: row.fields.measure,
        measure_uom_id: row.fields.measure_uom_id,
        measure_uom_name: row.fields.measure_uom_name,
        measure_label: row.fields.measure_label,
        total_available_quantity: formatQty(row.available),
        total_initial_quantity: formatQty(row.initial),
        total_batches: row.count,
    }));
}
function formatMeasureTotalsLabel(totals) {
    if (!totals.length) {
        return '';
    }
    return totals
        .map((row) => `${row.measure_label ?? row.measure ?? 'Sin medida'} → ${row.total_available_quantity}`)
        .join(' · ');
}
//# sourceMappingURL=inventory-measure.util.js.map