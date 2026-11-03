"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMarginAmount = formatMarginAmount;
exports.resolvePurchaseUnitCost = resolvePurchaseUnitCost;
exports.resolveLotMargin = resolveLotMargin;
exports.explainLotAverage = explainLotAverage;
exports.explainConfigurationOnly = explainConfigurationOnly;
const SOURCE_LABEL = {
    purchase: 'Compra',
    configuration: 'Configuración',
    mixed: 'Mixto',
    none: 'Sin costo',
};
function toNum(value) {
    if (value == null || !Number.isFinite(value))
        return null;
    return value;
}
function positive(value) {
    const parsed = toNum(value);
    if (parsed == null || parsed <= 0)
        return null;
    return parsed;
}
function round4(value) {
    return parseFloat(value.toFixed(4));
}
function formatMarginAmount(value) {
    const fixed = (Number.isFinite(value) ? value : 0).toFixed(4);
    const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
    const [whole, fraction = ''] = trimmed.split('.');
    const digits = Math.max(2, fraction.length);
    return `${whole}.${(fraction + '00').slice(0, digits)}`;
}
function formatPercent(value) {
    return (Number.isFinite(value) ? value : 0).toFixed(2);
}
function currencyOf(value) {
    return (value ?? 'MXN').trim().toUpperCase() || 'MXN';
}
function vendorLabel(name) {
    const trimmed = (name ?? '').trim();
    return trimmed || 'Proveedor';
}
function priceNote(price) {
    if (price.amount == null) {
        return 'Este producto no tiene precio en una lista activa.';
    }
    if (price.listName) {
        return `Precio de la lista ${price.listName}.`;
    }
    return 'Precio de la primera lista activa.';
}
function moneyOrNull(value) {
    return value == null ? null : formatMarginAmount(value);
}
function uomScale(purchase) {
    const original = positive(purchase.originalQuantity);
    const converted = positive(purchase.convertedQuantity);
    if (original != null && converted != null) {
        return original / converted;
    }
    return 1;
}
function resolvePurchaseUnitCost(purchase) {
    const real = positive(purchase.realUnitCostMxn);
    if (real != null) {
        return { cost: round4(real), basis: 'landed_mxn', missingRate: false, scaled: false };
    }
    const vendor = positive(purchase.vendorUnitCost);
    if (vendor == null) {
        return { cost: null, basis: 'vendor_mxn', missingRate: false, scaled: false };
    }
    const scale = uomScale(purchase);
    const scaled = vendor * scale;
    const scaledFlag = Math.abs(scale - 1) > 0.000001;
    if (currencyOf(purchase.currency) === 'USD') {
        const rate = positive(purchase.customsExchangeRate);
        if (rate == null) {
            return { cost: null, basis: 'vendor_usd', missingRate: true, scaled: scaledFlag };
        }
        return {
            cost: round4(scaled * rate),
            basis: 'vendor_usd',
            missingRate: false,
            scaled: scaledFlag,
        };
    }
    return { cost: round4(scaled), basis: 'vendor_mxn', missingRate: false, scaled: scaledFlag };
}
function splitConfig(lines) {
    const mxn = lines.filter((line) => currencyOf(line.currency) !== 'USD' && positive(line.cost) != null);
    const usd = lines.filter((line) => currencyOf(line.currency) === 'USD' && positive(line.cost) != null);
    if (mxn.length === 0) {
        return { mxn, usd, average: null };
    }
    const total = mxn.reduce((sum, line) => sum + (positive(line.cost) ?? 0), 0);
    return { mxn, usd, average: round4(total / mxn.length) };
}
function buildSnapshot(input) {
    const price = input.price.amount == null ? null : round4(input.price.amount);
    const cost = input.unitCost == null ? null : round4(input.unitCost);
    const marginAmount = price != null && cost != null ? round4(price - cost) : null;
    const marginPercentage = price != null && price > 0 && marginAmount != null
        ? formatPercent((marginAmount / price) * 100)
        : price != null && price <= 0 && marginAmount != null
            ? '0.00'
            : null;
    return {
        unit_price: moneyOrNull(price),
        price_list_name: input.price.listName,
        unit_cost: moneyOrNull(cost),
        margin_amount: moneyOrNull(marginAmount),
        margin_percentage: marginPercentage,
        source: input.source,
        source_label: SOURCE_LABEL[input.source],
        hint: input.hint,
        purchase_count: input.purchaseCount,
        configuration_count: input.configurationCount,
        missing_count: input.missingCount,
        cost_basis: input.basis,
        purchase_folio: input.folio,
    };
}
function formulaSentence(margin, averageOf) {
    if (margin.unit_price == null) {
        return 'Falta el precio de venta, así que el margen queda pendiente.';
    }
    if (margin.unit_cost == null) {
        return 'Falta el costo en pesos, así que el margen queda pendiente.';
    }
    const result = `${margin.unit_price} − ${margin.unit_cost} = ${margin.margin_amount}`;
    const percent = margin.margin_percentage != null ? ` (${margin.margin_percentage}%)` : '';
    if (!averageOf || averageOf.length <= 1) {
        return `${result}${percent}.`;
    }
    if (averageOf.length > 6) {
        return `Promedio de ${averageOf.length} costos = ${margin.unit_cost}. ${result}${percent}.`;
    }
    const parts = averageOf.map((value) => formatMarginAmount(value)).join(' + ');
    return `(${parts}) / ${averageOf.length} = ${margin.unit_cost}. ${result}${percent}.`;
}
function configLineRows(mxn, usd, used) {
    const rows = mxn.map((line) => ({
        label: vendorLabel(line.vendorName),
        detail: line.uomName ? `${line.uomName} · pesos` : 'Pesos',
        amount: formatMarginAmount(line.cost),
        currency: 'MXN',
        included: used,
    }));
    for (const line of usd) {
        rows.push({
            label: vendorLabel(line.vendorName),
            detail: 'Dólares. No entra al promedio en pesos.',
            amount: formatMarginAmount(line.cost),
            currency: 'USD',
            included: false,
        });
    }
    return rows;
}
function purchaseBasisNote(basis, scaled) {
    if (basis === 'landed_mxn') {
        return 'Costo final de la orden, en pesos. Ya incluye mercancía y gastos.';
    }
    if (basis === 'vendor_usd') {
        return scaled
            ? 'Costo de proveedor en dólares, pasado a pesos y a la unidad del inventario.'
            : 'Costo de proveedor en dólares, pasado a pesos con el tipo de cambio de la compra.';
    }
    return scaled
        ? 'Costo de proveedor en pesos, ajustado a la unidad del inventario.'
        : 'Costo de proveedor en pesos. La orden no tiene costo final.';
}
function lotHint(input) {
    let hint = 'Sin costo de compra ni de configuración en pesos.';
    if (input.source === 'purchase') {
        const folio = input.folio ? ` ${input.folio}` : '';
        if (input.basis === 'landed_mxn')
            hint = `Compra${folio}. Costo final en pesos.`;
        else if (input.basis === 'vendor_usd')
            hint = `Compra${folio}. Costo de proveedor pasado a pesos.`;
        else
            hint = `Compra${folio}. Costo de proveedor en pesos.`;
    }
    else if (input.source === 'configuration') {
        if (input.fallback === 'no_rate') {
            hint = 'La compra no se pudo pasar a pesos. Se usó el costo configurado.';
        }
        else if (input.fallback === 'no_purchase_cost') {
            hint = 'La compra no trae costo. Se usó el costo configurado.';
        }
        else {
            hint = 'Sin compra. Costo configurado del producto.';
        }
    }
    if (input.priceMissing) {
        hint = `${hint} Sin precio de venta.`;
    }
    return hint;
}
function resolveLotMargin(purchase, configLines, price) {
    const config = splitConfig(configLines);
    const resolved = purchase?.hasPurchase ? resolvePurchaseUnitCost(purchase) : null;
    let unitCost = null;
    let source = 'none';
    let basis = 'none';
    let fallback = null;
    const folio = purchase?.folio?.trim() || null;
    if (resolved?.cost != null) {
        unitCost = resolved.cost;
        source = 'purchase';
        basis = resolved.basis;
    }
    else if (config.average != null) {
        unitCost = config.average;
        source = 'configuration';
        basis = 'configuration';
        if (resolved?.missingRate)
            fallback = 'no_rate';
        else if (purchase?.hasPurchase)
            fallback = 'no_purchase_cost';
    }
    const margin = buildSnapshot({
        price,
        unitCost,
        source,
        basis,
        purchaseCount: source === 'purchase' ? 1 : 0,
        configurationCount: source === 'configuration' ? 1 : 0,
        missingCount: unitCost == null ? 1 : 0,
        folio: source === 'purchase' ? folio : null,
        hint: lotHint({
            source,
            basis,
            folio,
            fallback,
            priceMissing: price.amount == null,
        }),
    });
    const groups = [];
    if (purchase?.hasPurchase) {
        const used = source === 'purchase';
        let detail = resolved ? purchaseBasisNote(resolved.basis, resolved.scaled) : 'La compra no trae costo en pesos.';
        if (!used && fallback === 'no_rate') {
            detail = 'Está en dólares y no tiene tipo de cambio, así que no entra.';
        }
        else if (!used && fallback === 'no_purchase_cost') {
            detail = 'No trae costo usable, así que no entra.';
        }
        groups.push({
            title: 'Compra',
            note: used ? 'De aquí sale el costo de este lote.' : 'Esta compra no se usó.',
            lines: [
                {
                    label: folio || 'Orden de compra',
                    detail,
                    amount: resolved?.cost != null ? formatMarginAmount(resolved.cost) : null,
                    currency: 'MXN',
                    included: used,
                },
            ],
        });
    }
    if (config.mxn.length || config.usd.length) {
        const used = source === 'configuration';
        groups.push({
            title: 'Costo configurado',
            note: used
                ? config.mxn.length > 1
                    ? 'Se promedian los costos en pesos de esta unidad.'
                    : 'Se usa el costo en pesos configurado para esta unidad.'
                : 'No se usó porque el lote tiene costo de compra.',
            lines: configLineRows(config.mxn, config.usd, used),
        });
    }
    let headline = 'No hay costo de compra ni costo configurado en pesos.';
    let costNote = 'Sin un costo en pesos no se puede armar el margen.';
    if (source === 'purchase') {
        headline = folio
            ? `Este lote toma el costo de su compra ${folio}.`
            : 'Este lote toma el costo de su compra.';
        costNote = resolved ? purchaseBasisNote(resolved.basis, resolved.scaled) : '';
    }
    else if (source === 'configuration') {
        headline =
            fallback === 'no_rate'
                ? 'La compra no se pudo pasar a pesos. Este lote usa el costo configurado.'
                : fallback === 'no_purchase_cost'
                    ? 'La compra no trae costo. Este lote usa el costo configurado.'
                    : 'Este lote no tiene compra. El costo sale de la configuración del producto.';
        costNote =
            config.mxn.length > 1
                ? 'Promedio simple de los costos de proveedor en pesos.'
                : 'Costo de proveedor configurado en pesos.';
    }
    return {
        margin,
        explanation: {
            margin,
            headline,
            formula_sentence: formulaSentence(margin),
            price_note: priceNote(price),
            cost_note: costNote,
            groups,
        },
    };
}
function countLots(lots) {
    let purchase = 0;
    let configuration = 0;
    let missing = 0;
    const costs = [];
    const bases = new Set();
    let onlyFolio = null;
    for (const lot of lots) {
        if (lot.margin.source === 'purchase') {
            purchase += 1;
            bases.add(lot.margin.cost_basis);
            onlyFolio = purchase === 1 ? lot.margin.purchase_folio : null;
        }
        else if (lot.margin.source === 'configuration') {
            configuration += 1;
            bases.add('configuration');
        }
        else {
            missing += 1;
        }
        if (lot.margin.unit_cost != null) {
            costs.push(parseFloat(lot.margin.unit_cost));
        }
    }
    let source = 'none';
    if (purchase > 0 && configuration > 0)
        source = 'mixed';
    else if (purchase > 0)
        source = 'purchase';
    else if (configuration > 0)
        source = 'configuration';
    let basis = 'none';
    if (source === 'mixed' || bases.size > 1)
        basis = 'mixed';
    else if (bases.size === 1)
        basis = [...bases][0];
    return {
        purchase,
        configuration,
        missing,
        costs,
        basis,
        source,
        folio: source === 'purchase' && purchase === 1 ? onlyFolio : null,
    };
}
function averageHint(counts, priceMissing) {
    const used = counts.purchase + counts.configuration;
    if (used === 0) {
        return priceMissing ? 'Sin costo y sin precio de venta.' : 'Ningún lote tiene costo en pesos.';
    }
    const parts = [];
    if (counts.purchase) {
        parts.push(counts.purchase === 1 ? '1 compra' : `${counts.purchase} compras`);
    }
    if (counts.configuration) {
        parts.push(counts.configuration === 1 ? '1 configuración' : `${counts.configuration} configuraciones`);
    }
    const lotWord = used === 1 ? 'lote' : 'lotes';
    let hint = `Promedio de ${used} ${lotWord}: ${parts.join(' y ')}.`;
    if (counts.missing) {
        hint += counts.missing === 1 ? ' 1 lote sin costo.' : ` ${counts.missing} lotes sin costo.`;
    }
    if (priceMissing)
        hint += ' Sin precio de venta.';
    return hint;
}
function explainLotAverage(lots, price, configLines, scope) {
    const counts = countLots(lots);
    const average = counts.costs.length
        ? round4(counts.costs.reduce((sum, value) => sum + value, 0) / counts.costs.length)
        : null;
    const margin = buildSnapshot({
        price,
        unitCost: average,
        source: counts.source,
        basis: counts.basis,
        purchaseCount: counts.purchase,
        configurationCount: counts.configuration,
        missingCount: counts.missing,
        folio: counts.folio,
        hint: averageHint(counts, price.amount == null),
    });
    if (counts.source === 'purchase' && counts.purchase > 1) {
        margin.source_label = 'Compras';
    }
    const purchaseLines = lots
        .filter((lot) => lot.margin.source === 'purchase')
        .map((lot) => ({
        label: lot.label,
        detail: lot.detail,
        amount: lot.margin.unit_cost,
        currency: 'MXN',
        included: true,
    }));
    const configLotLines = lots
        .filter((lot) => lot.margin.source === 'configuration')
        .map((lot) => ({
        label: lot.label,
        detail: lot.detail,
        amount: lot.margin.unit_cost,
        currency: 'MXN',
        included: true,
    }));
    const missingLines = lots
        .filter((lot) => lot.margin.source === 'none')
        .map((lot) => ({
        label: lot.label,
        detail: lot.detail || 'Sin costo en pesos',
        amount: null,
        currency: null,
        included: false,
    }));
    const groups = [];
    if (purchaseLines.length) {
        groups.push({
            title: 'Compras',
            note: 'Cada lote aporta el costo de su orden.',
            lines: purchaseLines,
        });
    }
    if (configLotLines.length) {
        groups.push({
            title: 'Costo configurado',
            note: 'Estos lotes no tienen compra usable. Entran con el costo del producto.',
            lines: configLotLines,
        });
    }
    if (missingLines.length) {
        groups.push({
            title: 'Sin costo',
            note: 'No entran al promedio.',
            lines: missingLines,
        });
    }
    const config = splitConfig(configLines);
    if ((config.mxn.length || config.usd.length) && counts.purchase > 0 && counts.configuration === 0) {
        groups.push({
            title: 'Configuración del producto',
            note: 'Existe, pero no se usó porque los lotes tienen compra.',
            lines: configLineRows(config.mxn, config.usd, false),
        });
    }
    else if (config.mxn.length > 1 && counts.configuration > 0) {
        groups.push({
            title: 'De dónde sale el costo configurado',
            note: 'Promedio de estos costos en pesos.',
            lines: configLineRows(config.mxn, config.usd, true),
        });
    }
    else if (config.usd.length && counts.configuration === 0 && counts.purchase === 0) {
        groups.push({
            title: 'Configuración del producto',
            note: 'Están en dólares, así que no arman un costo en pesos.',
            lines: configLineRows(config.mxn, config.usd, false),
        });
    }
    let costNote = 'No hay costos en pesos para promediar.';
    if (counts.source === 'purchase') {
        costNote = 'Todos los lotes con costo salen de su compra.';
    }
    else if (counts.source === 'configuration') {
        costNote = 'No hubo compras usables. El promedio sale del costo configurado.';
    }
    else if (counts.source === 'mixed') {
        costNote = 'Unos lotes salen de su compra y otros del costo configurado.';
    }
    return {
        margin,
        headline: scope,
        formula_sentence: formulaSentence(margin, counts.costs),
        price_note: priceNote(price),
        cost_note: costNote,
        groups,
    };
}
function explainConfigurationOnly(configLines, price, uomName) {
    const config = splitConfig(configLines);
    const margin = buildSnapshot({
        price,
        unitCost: config.average,
        source: config.average != null ? 'configuration' : 'none',
        basis: config.average != null ? 'configuration' : 'none',
        purchaseCount: 0,
        configurationCount: config.average != null ? 1 : 0,
        missingCount: config.average == null ? 1 : 0,
        folio: null,
        hint: config.average != null
            ? 'Sin lotes con existencia. Costo configurado del producto.'
            : 'Sin lotes con existencia y sin costo configurado en pesos.',
    });
    const where = uomName ? ` en ${uomName}` : '';
    const groups = [];
    if (config.mxn.length || config.usd.length) {
        groups.push({
            title: 'Costo configurado',
            note: config.mxn.length > 1
                ? `Promedio de los costos en pesos${where}.`
                : `Costo en pesos${where}.`,
            lines: configLineRows(config.mxn, config.usd, config.average != null),
        });
    }
    return {
        margin,
        headline: 'No hay lotes con existencia. El costo de referencia es el configurado en el producto.',
        formula_sentence: formulaSentence(margin),
        price_note: priceNote(price),
        cost_note: config.average != null
            ? 'No se encontraron compras con existencia, así que se usa la configuración.'
            : 'No hay compras con existencia ni costo configurado en pesos.',
        groups,
    };
}
//# sourceMappingURL=inventory-margin.util.js.map