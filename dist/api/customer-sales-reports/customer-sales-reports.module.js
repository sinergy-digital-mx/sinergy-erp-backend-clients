"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSalesReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const sales_order_entity_1 = require("../../entities/sales-orders/sales-order.entity");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const customer_sales_reports_controller_1 = require("./customer-sales-reports.controller");
const customer_sales_reports_service_1 = require("./customer-sales-reports.service");
let CustomerSalesReportsModule = class CustomerSalesReportsModule {
};
exports.CustomerSalesReportsModule = CustomerSalesReportsModule;
exports.CustomerSalesReportsModule = CustomerSalesReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([sales_order_entity_1.SalesOrder]), auth_module_1.AuthModule, rbac_module_1.RBACModule],
        controllers: [customer_sales_reports_controller_1.CustomerSalesReportsController],
        providers: [customer_sales_reports_service_1.CustomerSalesReportsService],
    })
], CustomerSalesReportsModule);
//# sourceMappingURL=customer-sales-reports.module.js.map