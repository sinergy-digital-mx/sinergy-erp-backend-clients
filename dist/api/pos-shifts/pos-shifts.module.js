"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosShiftsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const pos_partial_shift_entity_1 = require("../../entities/pos/pos-partial-shift.entity");
const pos_partial_shift_denomination_entity_1 = require("../../entities/pos/pos-partial-shift-denomination.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const user_billing_branch_entity_1 = require("../../entities/users/user-billing-branch.entity");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const pos_sale_collection_entity_1 = require("../../entities/pos/pos-sale-collection.entity");
const customer_entity_1 = require("../../entities/customers/customer.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const sales_orders_module_1 = require("../sales-orders/sales-orders.module");
const customers_module_1 = require("../customers/customers.module");
const pos_shifts_service_1 = require("./pos-shifts.service");
const pos_shifts_controller_1 = require("./pos-shifts.controller");
let PosShiftsModule = class PosShiftsModule {
};
exports.PosShiftsModule = PosShiftsModule;
exports.PosShiftsModule = PosShiftsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                pos_daily_shift_entity_1.PosDailyShift,
                pos_partial_shift_entity_1.PosPartialShift,
                pos_partial_shift_denomination_entity_1.PosPartialShiftDenomination,
                user_entity_1.User,
                user_billing_branch_entity_1.UserBillingBranch,
                sales_order_entity_1.SalesOrder,
                customer_entity_1.Customer,
                pos_sale_collection_entity_1.PosSaleCollection,
                warehouse_entity_1.Warehouse,
            ]),
            rbac_module_1.RBACModule,
            (0, common_1.forwardRef)(() => sales_orders_module_1.SalesOrdersModule),
            customers_module_1.CustomersModule,
        ],
        controllers: [pos_shifts_controller_1.PosShiftsController],
        providers: [pos_shifts_service_1.PosShiftsService],
        exports: [pos_shifts_service_1.PosShiftsService],
    })
], PosShiftsModule);
//# sourceMappingURL=pos-shifts.module.js.map