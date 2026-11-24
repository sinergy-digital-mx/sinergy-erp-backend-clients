"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BRAND_NAV_COLORS = void 0;
exports.normalizeBrandHex = normalizeBrandHex;
exports.resolveBrandNavMeta = resolveBrandNavMeta;
const crypto_1 = require("crypto");
exports.DEFAULT_BRAND_NAV_COLORS = {
    start: '#1e1b4b',
    mid: '#312e81',
    end: '#4c1d95',
};
const HEX = /^#[0-9a-fA-F]{6}$/;
function normalizeBrandHex(value, fallback) {
    const raw = String(value ?? '').trim();
    return HEX.test(raw) ? raw.toLowerCase() : fallback;
}
function optionalBrandHex(value) {
    const raw = String(value ?? '').trim();
    return HEX.test(raw) ? raw.toLowerCase() : null;
}
function resolveBrandNavMeta(row) {
    const start = normalizeBrandHex(row?.brand_color_start, exports.DEFAULT_BRAND_NAV_COLORS.start);
    const mid = normalizeBrandHex(row?.brand_color_mid, exports.DEFAULT_BRAND_NAV_COLORS.mid);
    const end = normalizeBrandHex(row?.brand_color_end, exports.DEFAULT_BRAND_NAV_COLORS.end);
    const posSales = optionalBrandHex(row?.pos_sales_bar_color);
    const posCash = optionalBrandHex(row?.pos_cash_bar_color);
    return {
        cache_key: (0, crypto_1.createHash)('sha256')
            .update(`${start}|${mid}|${end}|${posSales ?? ''}|${posCash ?? ''}`)
            .digest('hex')
            .slice(0, 16),
        start,
        mid,
        end,
        pos_sales: posSales,
        pos_cash: posCash,
    };
}
//# sourceMappingURL=brand-nav-colors.util.js.map