"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HideInventoryCostColumnsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const inventory_margin_permission_1 = require("../../inventory/constants/inventory-margin-permission");
const omit_purchase_order_lot_cost_util_1 = require("../utils/omit-purchase-order-lot-cost.util");
let HideInventoryCostColumnsInterceptor = class HideInventoryCostColumnsInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if ((0, inventory_margin_permission_1.userCanViewInventoryMargin)(request?.user)) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.map)((body) => (0, omit_purchase_order_lot_cost_util_1.omitPurchaseOrderLotCosts)(body)));
    }
};
exports.HideInventoryCostColumnsInterceptor = HideInventoryCostColumnsInterceptor;
exports.HideInventoryCostColumnsInterceptor = HideInventoryCostColumnsInterceptor = __decorate([
    (0, common_1.Injectable)()
], HideInventoryCostColumnsInterceptor);
//# sourceMappingURL=hide-inventory-cost-columns.interceptor.js.map