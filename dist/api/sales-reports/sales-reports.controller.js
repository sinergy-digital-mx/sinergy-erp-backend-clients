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
exports.SalesReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const query_sales_by_seller_report_dto_1 = require("./dto/query-sales-by-seller-report.dto");
const sales_reports_service_1 = require("./sales-reports.service");
let SalesReportsController = class SalesReportsController {
    salesReportsService;
    constructor(salesReportsService) {
        this.salesReportsService = salesReportsService;
    }
    getSalesBySellerReport(query, req) {
        return this.salesReportsService.getSalesBySellerReport(req.user.tenant_id, query);
    }
    async exportSalesBySellerExcel(query, req, res) {
        const buffer = await this.salesReportsService.exportSalesBySellerExcel(req.user.tenant_id, query);
        const view = query.view === query_sales_by_seller_report_dto_1.SalesReportView.COMMISSIONS ? 'comisiones' : 'ventas';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.salesReportsService.getExportFilename(view)}"`);
        res.send(buffer);
    }
    getSalesBySellerOrders(query, req) {
        return this.salesReportsService.getSalesBySellerOrders(req.user.tenant_id, query);
    }
};
exports.SalesReportsController = SalesReportsController;
__decorate([
    (0, common_1.Get)('by-seller'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reporte de ventas o comisiones',
        description: 'view=sales agrupa por quien vendió (seller_user_id). view=commissions agrupa por comisionado (assigned_seller_user_id).',
    }),
    (0, swagger_1.ApiQuery)({ name: 'view', required: false, enum: query_sales_by_seller_report_dto_1.SalesReportView }),
    (0, swagger_1.ApiQuery)({ name: 'fiscal_configuration_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'billing_branch_id', required: false, type: String }),
    (0, swagger_1.ApiQuery)({
        name: 'period',
        required: false,
        enum: query_sales_by_seller_report_dto_1.SalesReportPeriod,
        example: query_sales_by_seller_report_dto_1.SalesReportPeriod.MONTH,
    }),
    (0, swagger_1.ApiQuery)({ name: 'date_from', required: false, type: String, description: 'Required when period=range' }),
    (0, swagger_1.ApiQuery)({ name: 'date_to', required: false, type: String, description: 'Required when period=range' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_sales_by_seller_report_dto_1.QuerySalesBySellerReportDto, Object]),
    __metadata("design:returntype", void 0)
], SalesReportsController.prototype, "getSalesBySellerReport", null);
__decorate([
    (0, common_1.Get)('by-seller/export/excel'),
    (0, swagger_1.ApiOperation)({ summary: 'Excel del reporte (mismas columnas que la vista activa)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_sales_by_seller_report_dto_1.QuerySalesBySellerReportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], SalesReportsController.prototype, "exportSalesBySellerExcel", null);
__decorate([
    (0, common_1.Get)('by-seller/orders'),
    (0, swagger_1.ApiOperation)({
        summary: 'Órdenes de un vendedor o comisionado (drill-down)',
        description: 'Mismos filtros y `view` del reporte. Click en fila → este endpoint.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_sales_by_seller_report_dto_1.QuerySalesBySellerOrdersDto, Object]),
    __metadata("design:returntype", void 0)
], SalesReportsController.prototype, "getSalesBySellerOrders", null);
exports.SalesReportsController = SalesReportsController = __decorate([
    (0, swagger_1.ApiTags)('Sales Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/sales-reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sales_reports_service_1.SalesReportsService])
], SalesReportsController);
//# sourceMappingURL=sales-reports.controller.js.map