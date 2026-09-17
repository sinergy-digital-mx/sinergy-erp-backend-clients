"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveQuotationSellerScopeUserId = resolveQuotationSellerScopeUserId;
exports.quotationIsVisibleToSeller = quotationIsVisibleToSeller;
exports.assertQuotationSellerAccess = assertQuotationSellerAccess;
const common_1 = require("@nestjs/common");
function resolveQuotationSellerScopeUserId(isAdmin, actorUserId, requestedSellerUserId) {
    if (!isAdmin) {
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
    if (!access || access.isAdmin) {
        return;
    }
    if (quotationIsVisibleToSeller(quotation, access.userId)) {
        return;
    }
    throw new common_1.NotFoundException(`Cotización no encontrada: ${quotation.id}`);
}
//# sourceMappingURL=quotation-seller-scope.util.js.map