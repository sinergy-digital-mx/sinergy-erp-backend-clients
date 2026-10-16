"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIPPING_CARGO_KINDS = void 0;
exports.resolveCargoKind = resolveCargoKind;
var shipping_entity_1 = require("../../../entities/logistics/shipping.entity");
Object.defineProperty(exports, "SHIPPING_CARGO_KINDS", { enumerable: true, get: function () { return shipping_entity_1.SHIPPING_CARGO_KINDS; } });
function resolveCargoKind(orderCount, transferCount) {
    if (orderCount > 0 && transferCount > 0)
        return 'mixed';
    if (transferCount > 0)
        return 'inventory_transfer';
    return 'order_delivery';
}
//# sourceMappingURL=shipping-cargo.util.js.map