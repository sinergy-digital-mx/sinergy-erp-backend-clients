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
exports.PosConfigurationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pos_configuration_service_1 = require("./pos-configuration.service");
const create_pos_configuration_dto_1 = require("./dto/create-pos-configuration.dto");
const update_pos_configuration_dto_1 = require("./dto/update-pos-configuration.dto");
const query_pos_configuration_dto_1 = require("./dto/query-pos-configuration.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let PosConfigurationController = class PosConfigurationController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.tenantId);
    }
    findAll(query, req) {
        return this.service.findAll(req.user.tenantId, query);
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
exports.PosConfigurationController = PosConfigurationController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos_configurations', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new POS configuration' }),
    (0, swagger_1.ApiBody)({ type: create_pos_configuration_dto_1.CreatePosConfigurationDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'POS configuration created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pos_configuration_dto_1.CreatePosConfigurationDto, Object]),
    __metadata("design:returntype", void 0)
], PosConfigurationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos_configurations', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated POS configurations with search and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'sucursal', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['VENTAS', 'COBRANZA'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of POS configurations retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_pos_configuration_dto_1.QueryPosConfigurationDto, Object]),
    __metadata("design:returntype", Promise)
], PosConfigurationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos_configurations', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific POS configuration by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'POS Configuration ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'POS configuration retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosConfigurationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos_configurations', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing POS configuration' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiBody)({ type: update_pos_configuration_dto_1.UpdatePosConfigurationDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'POS configuration updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_pos_configuration_dto_1.UpdatePosConfigurationDto, Object]),
    __metadata("design:returntype", void 0)
], PosConfigurationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(200),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'pos_configurations', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a POS configuration by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'POS configuration deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PosConfigurationController.prototype, "remove", null);
exports.PosConfigurationController = PosConfigurationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('tenant/pos-configurations'),
    (0, swagger_1.ApiTags)('POS Configurations'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [pos_configuration_service_1.PosConfigurationService])
], PosConfigurationController);
//# sourceMappingURL=pos-configuration.controller.js.map