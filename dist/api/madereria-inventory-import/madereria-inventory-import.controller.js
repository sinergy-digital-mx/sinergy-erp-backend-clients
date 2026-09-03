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
exports.MadereriaInventoryImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const import_inventory_dto_1 = require("./dto/import-inventory.dto");
const madereria_inventory_import_constants_1 = require("./madereria-inventory-import.constants");
const madereria_inventory_import_service_1 = require("./madereria-inventory-import.service");
let MadereriaInventoryImportController = class MadereriaInventoryImportController {
    service;
    constructor(service) {
        this.service = service;
    }
    startImport(file, dto, req) {
        if (!file) {
            throw new common_1.BadRequestException('Adjunta el archivo Excel de inventario');
        }
        const organizationId = req.user.tenantId ?? req.user.tenant_id;
        if (!organizationId) {
            throw new common_1.BadRequestException('No se pudo determinar la organización');
        }
        return this.service.startImportJob({
            organizationId,
            userId: req.user.id,
            fiscalConfigurationId: dto.fiscal_configuration_id,
            billingBranchId: dto.billing_branch_id,
            warehouseId: dto.warehouse_id,
            file,
        });
    }
    getJob(jobId, req) {
        const organizationId = req.user.tenantId ?? req.user.tenant_id;
        if (!organizationId) {
            throw new common_1.BadRequestException('No se pudo determinar la organización');
        }
        return this.service.getJobStatus(jobId, organizationId);
    }
};
exports.MadereriaInventoryImportController = MadereriaInventoryImportController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermission)(madereria_inventory_import_constants_1.ENTITY_CODE, 'Create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Iniciar importación de inventario (async). Devuelve job_id para consultar progreso.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: [
                'file',
                'fiscal_configuration_id',
                'billing_branch_id',
                'warehouse_id',
            ],
            properties: {
                file: { type: 'string', format: 'binary' },
                fiscal_configuration_id: { type: 'string', format: 'uuid' },
                billing_branch_id: { type: 'string', format: 'uuid' },
                warehouse_id: { type: 'string', format: 'uuid' },
            },
        },
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, import_inventory_dto_1.ImportMadereriaInventoryDto, Object]),
    __metadata("design:returntype", void 0)
], MadereriaInventoryImportController.prototype, "startImport", null);
__decorate([
    (0, common_1.Get)('jobs/:jobId'),
    (0, require_permissions_decorator_1.RequirePermission)(madereria_inventory_import_constants_1.ENTITY_CODE, 'Create'),
    (0, swagger_1.ApiOperation)({
        summary: 'Progreso / resultado de un trabajo de importación',
    }),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MadereriaInventoryImportController.prototype, "getJob", null);
exports.MadereriaInventoryImportController = MadereriaInventoryImportController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/madereria-inventory-import'),
    (0, swagger_1.ApiTags)('Madereria Importacion Inventario'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [madereria_inventory_import_service_1.MadereriaInventoryImportService])
], MadereriaInventoryImportController);
//# sourceMappingURL=madereria-inventory-import.controller.js.map