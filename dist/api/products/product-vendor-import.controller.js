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
exports.ProductVendorImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const product_vendor_import_service_1 = require("./services/product-vendor-import.service");
const query_vendor_cost_import_dto_1 = require("./dto/query-vendor-cost-import.dto");
const query_vendor_price_import_dto_1 = require("./dto/query-vendor-price-import.dto");
let ProductVendorImportController = class ProductVendorImportController {
    importService;
    constructor(importService) {
        this.importService = importService;
    }
    previewCosts(query, req) {
        return this.importService.previewCosts(req.user.tenant_id, query.vendor_id);
    }
    async exportCostTemplate(query, req, res) {
        const { buffer, filename } = await this.importService.exportCostTemplate(req.user.tenant_id, query.vendor_id);
        this.sendExcel(res, buffer, filename);
    }
    importCosts(file, dto, req) {
        if (!file) {
            throw new common_1.BadRequestException('Adjunta el archivo Excel descargado');
        }
        return this.importService.importCosts(req.user.tenant_id, dto.vendor_id, file);
    }
    previewPrices(query, req) {
        return this.importService.previewPrices(req.user.tenant_id, query.vendor_id, query.price_list_id);
    }
    async exportPriceTemplate(query, req, res) {
        const { buffer, filename } = await this.importService.exportPriceTemplate(req.user.tenant_id, query.vendor_id, query.price_list_id);
        this.sendExcel(res, buffer, filename);
    }
    importPrices(file, dto, req) {
        if (!file) {
            throw new common_1.BadRequestException('Adjunta el archivo Excel descargado');
        }
        return this.importService.importPrices(req.user.tenant_id, dto.vendor_id, dto.price_list_id, file);
    }
    sendExcel(res, buffer, filename) {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }
};
exports.ProductVendorImportController = ProductVendorImportController;
__decorate([
    (0, common_1.Get)('vendor-costs/preview'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Conteo de productos con costo de un proveedor' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendor_cost_import_dto_1.QueryVendorCostImportDto, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorImportController.prototype, "previewCosts", null);
__decorate([
    (0, common_1.Get)('vendor-costs/template'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar template Excel de costos por proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Archivo Excel generado' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendor_cost_import_dto_1.QueryVendorCostImportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductVendorImportController.prototype, "exportCostTemplate", null);
__decorate([
    (0, common_1.Post)('vendor-costs'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Importar costos por proveedor desde el template' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file', 'vendor_id'],
            properties: {
                file: { type: 'string', format: 'binary' },
                vendor_id: { type: 'string', format: 'uuid' },
            },
        },
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_vendor_cost_import_dto_1.QueryVendorCostImportDto, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorImportController.prototype, "importCosts", null);
__decorate([
    (0, common_1.Get)('vendor-prices/preview'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Conteo de productos del proveedor para una lista de precios' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendor_price_import_dto_1.QueryVendorPriceImportDto, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorImportController.prototype, "previewPrices", null);
__decorate([
    (0, common_1.Get)('vendor-prices/template'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar template Excel de precios por proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Archivo Excel generado' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendor_price_import_dto_1.QueryVendorPriceImportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductVendorImportController.prototype, "exportPriceTemplate", null);
__decorate([
    (0, common_1.Post)('vendor-prices'),
    (0, require_permissions_decorator_1.RequirePermission)('Product', 'Update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Importar precios por proveedor desde el template' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['file', 'vendor_id', 'price_list_id'],
            properties: {
                file: { type: 'string', format: 'binary' },
                vendor_id: { type: 'string', format: 'uuid' },
                price_list_id: { type: 'string', format: 'uuid' },
            },
        },
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_vendor_price_import_dto_1.QueryVendorPriceImportDto, Object]),
    __metadata("design:returntype", void 0)
], ProductVendorImportController.prototype, "importPrices", null);
exports.ProductVendorImportController = ProductVendorImportController = __decorate([
    (0, swagger_1.ApiTags)('Product Vendor Import'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenant/products/import'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    __metadata("design:paramtypes", [product_vendor_import_service_1.ProductVendorImportService])
], ProductVendorImportController);
//# sourceMappingURL=product-vendor-import.controller.js.map