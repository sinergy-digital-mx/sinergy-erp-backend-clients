"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_LIST_PREFILTERS = void 0;
exports.normalizeCustomerListSettings = normalizeCustomerListSettings;
exports.shouldPrefilterCustomerList = shouldPrefilterCustomerList;
exports.CUSTOMER_LIST_PREFILTERS = ['off', 'sellers', 'everyone'];
function normalizeCustomerListSettings(raw) {
    const value = raw && typeof raw === 'object'
        ? raw.prefilter
        : raw;
    if (value === 'off' || value === 'sellers' || value === 'everyone') {
        return { prefilter: value };
    }
    return { prefilter: 'sellers' };
}
function shouldPrefilterCustomerList(prefilter, canViewAll) {
    if (prefilter === 'off')
        return false;
    if (prefilter === 'everyone')
        return true;
    return !canViewAll;
}
//# sourceMappingURL=customer-list-settings.util.js.map