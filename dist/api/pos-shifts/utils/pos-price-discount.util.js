"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POS_PRICE_DISCOUNT_ACTION = void 0;
exports.isPosPriceDiscountLine = isPosPriceDiscountLine;
exports.assertPosPriceDiscountAllowed = assertPosPriceDiscountAllowed;
const common_1 = require("@nestjs/common");
const jwt_permission_util_1 = require("../../rbac/utils/jwt-permission.util");
exports.POS_PRICE_DISCOUNT_ACTION = 'ApplyPriceDiscount';
function hasProductDiscount(line) {
    return typeof line.product_discount_id === 'string' && line.product_discount_id.trim().length > 0;
}
function roundPercent(value) {
    return Math.round(value * 100) / 100;
}
function isPosPriceDiscountLine(line) {
    if (!line || hasProductDiscount(line))
        return false;
    const pct = Number(line.discount_percentage ?? 0);
    return Number.isFinite(pct) && pct > 0;
}
function priceDiscountKey(line) {
    if (!isPosPriceDiscountLine(line))
        return null;
    const pct = roundPercent(Number(line.discount_percentage));
    return `${line.product_id ?? ''}|${line.product_uom_id ?? ''}|${pct.toFixed(2)}`;
}
function countPriceDiscounts(lines) {
    const counts = new Map();
    for (const line of lines) {
        const key = priceDiscountKey(line);
        if (!key)
            continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}
function assertPosPriceDiscountAllowed(user, incoming, existing) {
    const discounted = (incoming ?? []).filter(isPosPriceDiscountLine);
    for (const line of discounted) {
        const pct = roundPercent(Number(line.discount_percentage));
        if (pct <= 0 || pct > 100) {
            throw new common_1.BadRequestException('El descuento en precio debe estar entre 0.01% y 100%');
        }
    }
    if (!discounted.length || (0, jwt_permission_util_1.userHasJwtPermission)(user, 'POS', exports.POS_PRICE_DISCOUNT_ACTION)) {
        return;
    }
    const stored = countPriceDiscounts(existing ?? []);
    const asked = countPriceDiscounts(discounted);
    for (const [key, count] of asked) {
        if ((stored.get(key) ?? 0) < count) {
            throw new common_1.ForbiddenException('No tienes permiso para aplicar descuento al precio en POS');
        }
    }
}
//# sourceMappingURL=pos-price-discount.util.js.map