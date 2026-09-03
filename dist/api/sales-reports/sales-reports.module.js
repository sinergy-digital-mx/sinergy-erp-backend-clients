"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const auth_module_1 = require("../auth/auth.module");
const goals_module_1 = require("../goals/goals.module");
const sales_reports_controller_1 = require("./sales-reports.controller");
const sales_reports_service_1 = require("./sales-reports.service");
let SalesReportsModule = class SalesReportsModule {
};
exports.SalesReportsModule = SalesReportsModule;
exports.SalesReportsModule = SalesReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([sales_order_entity_1.SalesOrder, user_entity_1.User]), auth_module_1.AuthModule, goals_module_1.GoalsModule],
        controllers: [sales_reports_controller_1.SalesReportsController],
        providers: [sales_reports_service_1.SalesReportsService],
    })
], SalesReportsModule);
//# sourceMappingURL=sales-reports.module.js.map