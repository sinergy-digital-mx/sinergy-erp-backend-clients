"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meanCost = meanCost;
exports.priceFromMargin = priceFromMargin;
exports.priceListLabel = priceListLabel;
exports.isManualPrice = isManualPrice;
const unit_amount_util_1 = require("../../../common/utils/unit-amount.util");
function meanCost(costs) {
    const values = costs.filter((value) => typeof value === 'number' && Number.isFinite(value));
    if (!values.length)
        return null;
    return (0, unit_amount_util_1.roundUnitAmount)(values.reduce((sum, value) => sum + value, 0) / values.length);
}
function priceFromMargin(averageCost, marginPercent, uomFactor, baseFactor) {
    const base = baseFactor > 0 ? baseFactor : 1;
    const factor = (uomFactor > 0 ? uomFactor : 1) / base;
    return (0, unit_amount_util_1.roundUnitAmount)(averageCost * factor * (1 + marginPercent / 100));
}
function priceListLabel(listNumber, name) {
    if (listNumber != null && Number.isFinite(listNumber)) {
        return `L${listNumber}`;
    }
    const trimmed = name.trim();
    if (trimmed.length <= 8)
        return trimmed;
    return `${trimmed.slice(0, 7)}…`;
}
function isManualPrice(price, calculated) {
    if (price == null || calculated == null)
        return false;
    return Math.abs(price - calculated) > 0.0001;
}
//# sourceMappingURL=price-update.util.js.map