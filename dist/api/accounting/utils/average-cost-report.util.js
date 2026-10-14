"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundAverageCost = roundAverageCost;
exports.isoDay = isoDay;
exports.formatSlashDate = formatSlashDate;
exports.formatPedimentoLabel = formatPedimentoLabel;
exports.valuePurchaseReceipt = valuePurchaseReceipt;
exports.pickPrice1 = pickPrice1;
exports.buildAverageCostRows = buildAverageCostRows;
exports.filterAverageCostRows = filterAverageCostRows;
exports.summarizeAverageCostRows = summarizeAverageCostRows;
function roundAverageCost(value, scale) {
    const factor = 10 ** scale;
    return Math.round((value + Number.EPSILON) * factor) / factor;
}
function toNum(value) {
    if (value == null || value === '') {
        return null;
    }
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
}
function positive(value) {
    const parsed = toNum(value);
    if (parsed == null || parsed <= 0) {
        return null;
    }
    return parsed;
}
function isoDay(value) {
    if (value == null || value === '') {
        return null;
    }
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return null;
        }
        const year = value.getUTCFullYear();
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const day = String(value.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
    return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}
function formatSlashDate(value) {
    const iso = isoDay(value);
    return iso ? iso.replace(/-/g, '/') : null;
}
function formatPedimentoLabel(entry) {
    const raw = entry.raw?.trim();
    if (raw) {
        return raw;
    }
    const number = entry.number?.trim() || null;
    const date = formatSlashDate(entry.date);
    const customs = entry.customs?.trim() || null;
    const vendor = entry.vendor?.trim() || null;
    const tail = customs && vendor ? `${customs}-${vendor}` : customs || vendor;
    const parts = [number, date, tail].filter((part) => !!part);
    return parts.length ? parts.join(' - ') : null;
}
function pedimentoKey(label) {
    return label.replace(/\s+/g, ' ').trim().toUpperCase();
}
function samePedimento(left, right) {
    if (pedimentoKey(left) === pedimentoKey(right)) {
        return true;
    }
    const leftDigits = left.replace(/\D/g, '');
    const rightDigits = right.replace(/\D/g, '');
    if (!leftDigits || !rightDigits) {
        return false;
    }
    if (leftDigits === rightDigits) {
        return true;
    }
    const shorter = leftDigits.length < rightDigits.length ? leftDigits : rightDigits;
    const longer = leftDigits.length < rightDigits.length ? rightDigits : leftDigits;
    return shorter.length >= 7 && longer.includes(shorter);
}
function pushPedimento(bucket, label, date) {
    if (!label) {
        return;
    }
    const existing = bucket.pedimentos.find((item) => samePedimento(item.label, label));
    if (existing) {
        if (label.length > existing.label.length) {
            existing.label = label;
            existing.date = isoDay(date) ?? existing.date;
        }
        return;
    }
    bucket.pedimentos.push({ label, date: isoDay(date) });
}
function valuePurchaseReceipt(line) {
    const original = positive(line.received_original_quantity);
    const converted = positive(line.received_converted_quantity);
    const quantity = converted ?? original;
    if (quantity == null) {
        return null;
    }
    const scale = original != null && converted != null ? original / converted : 1;
    const real = toNum(line.real_unit_cost_mxn);
    if (real != null) {
        return {
            quantity,
            unitCost: roundAverageCost(real * scale, 4),
            usedRealCost: true,
        };
    }
    const vendor = toNum(line.received_original_unit_total) ?? toNum(line.unit_total);
    if (vendor == null) {
        return null;
    }
    const currency = (line.payment_currency ?? 'MXN').trim().toUpperCase();
    let mxn = vendor;
    if (currency === 'USD') {
        const rate = toNum(line.customs_exchange_rate);
        if (rate == null || rate <= 0) {
            return null;
        }
        mxn = vendor * rate;
    }
    return {
        quantity,
        unitCost: roundAverageCost(mxn * scale, 4),
        usedRealCost: false,
    };
}
function isPrecio1Name(name) {
    const normalized = (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'precio 1' || normalized === 'precio1';
}
function isBaseUom(value) {
    return value === true || value === 1 || value === '1';
}
function dateMillis(value) {
    if (value == null || value === '') {
        return Number.MAX_SAFE_INTEGER;
    }
    const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}
function pickPrice1(options) {
    const usable = options.filter((option) => toNum(option.price) != null);
    if (!usable.length) {
        return null;
    }
    const named = usable.filter((option) => isPrecio1Name(option.price_list_name));
    const pool = named.length ? named : usable;
    const sorted = [...pool].sort((left, right) => {
        const baseDiff = Number(isBaseUom(right.is_base)) - Number(isBaseUom(left.is_base));
        if (baseDiff !== 0) {
            return baseDiff;
        }
        return dateMillis(left.price_list_created_at) - dateMillis(right.price_list_created_at);
    });
    const chosen = sorted[0];
    const price = toNum(chosen.price);
    if (price == null) {
        return null;
    }
    return {
        price: roundAverageCost(price, 2),
        price_list_name: chosen.price_list_name?.trim() || null,
    };
}
function margins(price, averageCost) {
    if (price == null) {
        return { margin_amount: null, margin_percent: null };
    }
    const marginAmount = roundAverageCost(price - averageCost, 2);
    if (price <= 0) {
        return { margin_amount: marginAmount, margin_percent: null };
    }
    return {
        margin_amount: marginAmount,
        margin_percent: roundAverageCost((marginAmount / price) * 100, 2),
    };
}
function sortedPedimentos(bucket) {
    return [...bucket.pedimentos]
        .sort((left, right) => {
        if (left.date && right.date && left.date !== right.date) {
            return left.date < right.date ? -1 : 1;
        }
        if (left.date && !right.date) {
            return -1;
        }
        if (!left.date && right.date) {
            return 1;
        }
        return left.label.localeCompare(right.label, 'es');
    })
        .map((item) => item.label);
}
function buildAverageCostRows(input) {
    const buckets = new Map();
    for (const receipt of input.receipts) {
        const valued = valuePurchaseReceipt(receipt);
        if (!valued || !receipt.product_id) {
            continue;
        }
        const bucket = buckets.get(receipt.product_id) ?? {
            product_id: receipt.product_id,
            sku: (receipt.sku ?? '').trim(),
            name: (receipt.name ?? '').trim() || (receipt.sku ?? '').trim(),
            sat_clave: receipt.sat_clave?.trim() || null,
            quantity: 0,
            totalCost: 0,
            receiptCount: 0,
            realCount: 0,
            purchaseCount: 0,
            pedimentos: [],
        };
        bucket.quantity += valued.quantity;
        bucket.totalCost += valued.quantity * valued.unitCost;
        bucket.receiptCount += 1;
        if (valued.usedRealCost) {
            bucket.realCount += 1;
        }
        else {
            bucket.purchaseCount += 1;
        }
        pushPedimento(bucket, formatPedimentoLabel({
            number: receipt.pedimento_number,
            date: receipt.customs_date,
        }), receipt.customs_date);
        buckets.set(receipt.product_id, bucket);
    }
    for (const entry of input.pedimentos) {
        const bucket = buckets.get(entry.product_id);
        if (!bucket) {
            continue;
        }
        pushPedimento(bucket, formatPedimentoLabel(entry), entry.date);
    }
    const pricesByProduct = new Map();
    for (const price of input.prices) {
        const list = pricesByProduct.get(price.product_id) ?? [];
        list.push(price);
        pricesByProduct.set(price.product_id, list);
    }
    const rows = [...buckets.values()].map((bucket) => {
        const averageCost = roundAverageCost(bucket.totalCost / bucket.quantity, 2);
        const quantity = roundAverageCost(bucket.quantity, 3);
        const price = pickPrice1(pricesByProduct.get(bucket.product_id) ?? []);
        const margin = margins(price?.price ?? null, averageCost);
        const costBasis = bucket.realCount > 0 && bucket.purchaseCount > 0
            ? 'mixed'
            : bucket.realCount > 0
                ? 'real'
                : 'purchase';
        return {
            product_id: bucket.product_id,
            sku: bucket.sku,
            name: bucket.name,
            sat_clave: bucket.sat_clave,
            pedimentos: sortedPedimentos(bucket),
            price: price?.price ?? null,
            price_list_name: price?.price_list_name ?? null,
            average_cost: averageCost,
            quantity,
            total_cost: roundAverageCost(quantity * averageCost, 2),
            margin_amount: margin.margin_amount,
            margin_percent: margin.margin_percent,
            cost_basis: costBasis,
            receipt_count: bucket.receiptCount,
        };
    });
    rows.sort((left, right) => left.sku.localeCompare(right.sku, 'es', { numeric: true, sensitivity: 'base' }));
    return rows;
}
function filterAverageCostRows(rows, search) {
    const query = search?.trim().toLowerCase();
    if (!query) {
        return rows;
    }
    return rows.filter((row) => {
        const haystack = [row.sku, row.name, row.sat_clave ?? '', ...row.pedimentos]
            .join(' ')
            .toLowerCase();
        return haystack.includes(query);
    });
}
function summarizeAverageCostRows(rows) {
    return {
        product_count: rows.length,
        total_quantity: roundAverageCost(rows.reduce((sum, row) => sum + row.quantity, 0), 3),
        total_cost: roundAverageCost(rows.reduce((sum, row) => sum + row.total_cost, 0), 2),
        real_cost_product_count: rows.filter((row) => row.cost_basis !== 'purchase').length,
    };
}
//# sourceMappingURL=average-cost-report.util.js.map