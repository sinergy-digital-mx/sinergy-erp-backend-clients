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
exports.InventoryBatchController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../api/auth/jwt-auth.guard");
const tenant_module_validation_guard_1 = require("../../../api/auth/tenant-module-validation.guard");
const inventory_batch_service_1 = require("../services/inventory-batch.service");
const query_inventory_batch_dto_1 = require("../dto/query-inventory-batch.dto");
let InventoryBatchController = class InventoryBatchController {
    inventoryBatchService;
    constructor(inventoryBatchService) {
        this.inventoryBatchService = inventoryBatchService;
    }
    async listBatches(query, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryBatchService.queryBatches(tenantId, query);
    }
    async getWarehouseStats(warehouseId, req) {
        const tenantId = req.user.tenant_id;
        return this.inventoryBatchService.getWarehouseStats(tenantId, warehouseId);
    }
    async uploadPhoto(id, file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No se subió ningún archivo');
        }
        const tenantId = req.user.tenant_id;
        const batch = await this.inventoryBatchService.uploadPhoto(id, tenantId, file);
        return {
            message: 'Batch photo uploaded successfully',
            data: batch,
        };
    }
};
exports.InventoryBatchController = InventoryBatchController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List inventory batches',
        description: 'Get a paginated list of inventory batches with optional filters',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'batch_number',
        required: false,
        type: String,
        description: 'Filter by batch number (partial match)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'product_id',
        required: false,
        type: String,
        description: 'Filter by product ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'warehouse_id',
        required: false,
        type: String,
        description: 'Filter by warehouse ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'purchase_order_batch_id',
        required: false,
        type: String,
        description: 'Filter by purchase order batch ID',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'created_from',
        required: false,
        type: String,
        description: 'Filter batches created from this date (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'created_to',
        required: false,
        type: String,
        description: 'Filter batches created until this date (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Page number (default: 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Items per page (default: 20)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_by',
        required: false,
        enum: ['batch_number', 'created_at', 'quantity'],
        description: 'Sort by field (default: created_at)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'sort_order',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort order (default: DESC)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of inventory batches with pagination metadata',
        schema: {
            example: {
                data: [
                    {
                        id: 'uuid',
                        batch_number: 'BATCH-2024-001',
                        warehouse: { id: 'uuid', name: 'Central' },
                        product: { id: 'uuid', name: 'Tornillos' },
                        uom: { id: 'uuid', name: 'Unidades' },
                        quantity: 500,
                        purchase_order: { id: 'uuid', folio: 'OC-123' },
                        created_by: 'user-id',
                        created_at: '2024-01-15T10:30:00Z',
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 150,
                    pages: 8,
                },
            },
        },
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_inventory_batch_dto_1.QueryInventoryBatchDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryBatchController.prototype, "listBatches", null);
__decorate([
    (0, common_1.Get)('warehouse/:warehouseId/stats'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get warehouse inventory statistics',
        description: 'Get statistics about batches in a specific warehouse',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Warehouse inventory statistics',
        schema: {
            example: {
                total_batches: 45,
                unique_products: 12,
                total_quantity: 5000,
            },
        },
    }),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryBatchController.prototype, "getWarehouseStats", null);
__decorate([
    (0, common_1.Post)(':id/photo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload photo for an inventory batch',
        description: 'Upload or replace an inventory batch photo (label, lot state, etc.)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Batch photo uploaded successfully',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryBatchController.prototype, "uploadPhoto", null);
exports.InventoryBatchController = InventoryBatchController = __decorate([
    (0, swagger_1.ApiTags)('Inventory Batches'),
    (0, common_1.Controller)('tenant/inventory-batches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_module_validation_guard_1.TenantModuleValidationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [inventory_batch_service_1.InventoryBatchService])
], InventoryBatchController);
//# sourceMappingURL=inventory-batch.controller.js.map