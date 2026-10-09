"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HidePurchaseOrderRealCostInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const purchase_order_real_cost_permission_1 = require("../constants/purchase-order-real-cost-permission");
const omit_purchase_order_real_cost_util_1 = require("../utils/omit-purchase-order-real-cost.util");
let HidePurchaseOrderRealCostInterceptor = class HidePurchaseOrderRealCostInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if ((0, purchase_order_real_cost_permission_1.userCanViewPurchaseOrderRealCost)(request?.user)) {
            return next.handle();
        }
        return next.handle().pipe((0, operators_1.map)((body) => (0, omit_purchase_order_real_cost_util_1.omitPurchaseOrderRealCost)(body)));
    }
};
exports.HidePurchaseOrderRealCostInterceptor = HidePurchaseOrderRealCostInterceptor;
exports.HidePurchaseOrderRealCostInterceptor = HidePurchaseOrderRealCostInterceptor = __decorate([
    (0, common_1.Injectable)()
], HidePurchaseOrderRealCostInterceptor);
//# sourceMappingURL=hide-purchase-order-real-cost.interceptor.js.map