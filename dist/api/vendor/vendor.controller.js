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
exports.VendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vendor_service_1 = require("./vendor.service");
const vendors_export_service_1 = require("./services/vendors-export.service");
const create_vendor_dto_1 = require("./dto/create-vendor.dto");
const update_vendor_dto_1 = require("./dto/update-vendor.dto");
const query_vendor_dto_1 = require("./dto/query-vendor.dto");
const query_vendor_export_dto_1 = require("./dto/query-vendor-export.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let VendorController = class VendorController {
    service;
    exportService;
    constructor(service, exportService) {
        this.service = service;
        this.exportService = exportService;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.tenantId);
    }
    findAll(query, req) {
        return this.service.findAll(req.user.tenantId, query);
    }
    async exportExcel(query, req, res) {
        const buffer = await this.exportService.exportVendors(req.user.tenantId, query);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${this.exportService.getFilename()}"`);
        res.send(buffer);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user.tenantId);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user.tenantId);
    }
    remove(id, req) {
        return this.service.remove(id, req.user.tenantId);
    }
};
exports.VendorController = VendorController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'vendors', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new vendor' }),
    (0, swagger_1.ApiBody)({ type: create_vendor_dto_1.CreateVendorDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Vendor created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_vendor_dto_1.CreateVendorDto, Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'vendors', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated vendors with search and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'state', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'country', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'vendor_type', required: false, enum: ['NATIONAL', 'INTERNATIONAL'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of vendors retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendor_dto_1.QueryVendorDto, Object]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'vendors', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Descargar Excel de proveedores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Archivo Excel generado' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_vendor_export_dto_1.QueryVendorExportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'vendors', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific vendor by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Vendor ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendor retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'vendors', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing vendor' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: update_vendor_dto_1.UpdateVendorDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendor updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_vendor_dto_1.UpdateVendorDto, Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'vendors', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a vendor by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendor deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "remove", null);
exports.VendorController = VendorController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/vendors'),
    (0, swagger_1.ApiTags)('Vendors'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [vendor_service_1.VendorService,
        vendors_export_service_1.VendorsExportService])
], VendorController);
//# sourceMappingURL=vendor.controller.js.map