"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const shipping_entity_1 = require("../../entities/logistics/shipping.entity");
const shipping_stop_entity_1 = require("../../entities/logistics/shipping-stop.entity");
const truck_entity_1 = require("../../entities/logistics/truck.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const customer_address_entity_1 = require("../../entities/customers/customer-address.entity");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const shippings_controller_1 = require("./shippings.controller");
const shippings_service_1 = require("./shippings.service");
let ShippingsModule = class ShippingsModule {
};
exports.ShippingsModule = ShippingsModule;
exports.ShippingsModule = ShippingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                shipping_entity_1.Shipping,
                shipping_stop_entity_1.ShippingStop,
                truck_entity_1.Truck,
                warehouse_entity_1.Warehouse,
                billing_branch_entity_1.BillingBranch,
                user_entity_1.User,
                sales_order_entity_1.SalesOrder,
                customer_address_entity_1.CustomerAddress,
            ]),
            auth_module_1.AuthModule,
            rbac_module_1.RBACModule,
        ],
        controllers: [shippings_controller_1.ShippingsController],
        providers: [shippings_service_1.ShippingsService],
        exports: [shippings_service_1.ShippingsService],
    })
], ShippingsModule);
//# sourceMappingURL=shippings.module.js.map