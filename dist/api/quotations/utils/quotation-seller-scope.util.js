"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userCanViewAllQuotations = userCanViewAllQuotations;
exports.resolveQuotationSellerScopeUserId = resolveQuotationSellerScopeUserId;
exports.quotationIsVisibleToSeller = quotationIsVisibleToSeller;
exports.assertQuotationSellerAccess = assertQuotationSellerAccess;
const common_1 = require("@nestjs/common");
const entity_code_util_1 = require("../../rbac/utils/entity-code.util");
function listJwtPermissionStrings(user) {
    const permissions = user?.permissions;
    if (Array.isArray(permissions)) {
        return permissions.filter((item) => typeof item === 'string');
    }
    if (!permissions || typeof permissions !== 'object') {
        return [];
    }
    const flat = [];
    for (const [module, actions] of Object.entries(permissions)) {
        if (!Array.isArray(actions)) {
            continue;
        }
        for (const action of actions) {
            const actionStr = typeof action === 'string'
                ? action
                : action && typeof action === 'object'
                    ? String(action.action ?? '')
                    : '';
            if (actionStr) {
                flat.push(`${module}:${actionStr}`);
            }
        }
    }
    return flat;
}
function userCanViewAllQuotations(user) {
    return listJwtPermissionStrings(user).some((raw) => {
        const colon = raw.indexOf(':');
        if (colon <= 0) {
            return false;
        }
        const entity = raw.slice(0, colon);
        const action = raw.slice(colon + 1).replace(/[_-]/g, '').toLowerCase();
        return (0, entity_code_util_1.entityCodesMatch)(entity, 'Quotation') && action === 'viewall';
    });
}
function resolveQuotationSellerScopeUserId(canViewAll, actorUserId, requestedSellerUserId) {
    if (!canViewAll) {
        if (requestedSellerUserId && requestedSellerUserId !== actorUserId) {
            throw new common_1.ForbiddenException('No puedes filtrar cotizaciones de otros vendedores');
        }
        return actorUserId;
    }
    const requested = requestedSellerUserId?.trim();
    return requested || null;
}
function quotationIsVisibleToSeller(quotation, userId) {
    return (quotation.seller_user_id === userId ||
        quotation.assigned_seller_user_id === userId);
}
function assertQuotationSellerAccess(quotation, access) {
    if (!access || access.canViewAll) {
        return;
    }
    if (quotationIsVisibleToSeller(quotation, access.userId)) {
        return;
    }
    throw new common_1.NotFoundException(`Cotización no encontrada: ${quotation.id}`);
}
//# sourceMappingURL=quotation-seller-scope.util.js.map