"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSalesReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const customer_sales_reports_constants_1 = require("./customer-sales-reports.constants");
const query_customer_sales_report_dto_1 = require("./dto/query-customer-sales-report.dto");
const customer_sales_reports_service_1 = require("./customer-sales-reports.service");
let CustomerSalesReportsController = class CustomerSalesReportsController {
    customerSalesReportsService;
    constructor(customerSalesReportsService) {
        this.customerSalesReportsService = customerSalesReportsService;
    }
    getTopCustomers(query, req) {
        return this.customerSalesReportsService.getTopCustomersReport(req.user.tenant_id, query, query.limit ?? customer_sales_reports_constants_1.DEFAULT_TOP_LIMIT);
    }
    async exportTopCustomersExcel(query, req, res) {
        const buffer = await this.customerSalesReportsService.exportTopCustomersExcel(req.user.tenant_id, query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.customerSalesReportsService.getExportFilename()}"`);
        res.send(buffer);
    }
};
exports.CustomerSalesReportsController = CustomerSalesReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermission)(customer_sales_reports_constants_1.ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({
        summary: 'Top de clientes por sucursal / razón social',
        description: 'Agrupa órdenes surtidas por cliente. Ventas = número de órdenes. Total comprado = suma de totales.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'fiscal_configuration_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'billing_branch_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'period',
        required: false,
        enum: query_customer_sales_report_dto_1.CustomerSalesReportPeriod,
        example: query_customer_sales_report_dto_1.CustomerSalesReportPeriod.MONTH,
    }),
    (0, swagger_1.ApiQuery)({ name: 'date_from', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'date_to', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: customer_sales_reports_constants_1.DEFAULT_TOP_LIMIT }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_customer_sales_report_dto_1.QueryCustomerSalesReportDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerSalesReportsController.prototype, "getTopCustomers", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, require_permissions_decorator_1.RequirePermission)(customer_sales_reports_constants_1.ENTITY_CODE, 'Read'),
    (0, swagger_1.ApiOperation)({ summary: 'Excel del top de clientes (mismas columnas que la vista)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_customer_sales_report_dto_1.QueryCustomerSalesReportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerSalesReportsController.prototype, "exportTopCustomersExcel", null);
exports.CustomerSalesReportsController = CustomerSalesReportsController = __decorate([
    (0, swagger_1.ApiTags)('Customer Sales Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/customer-sales-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [customer_sales_reports_service_1.CustomerSalesReportsService])
], CustomerSalesReportsController);
//# sourceMappingURL=customer-sales-reports.controller.js.map