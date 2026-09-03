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
exports.LeadGroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lead_groups_service_1 = require("./lead-groups.service");
const create_lead_group_dto_1 = require("./dto/create-lead-group.dto");
const update_lead_group_dto_1 = require("./dto/update-lead-group.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let LeadGroupsController = class LeadGroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    create(dto, req) {
        return this.groupsService.create(dto, req.user.tenantId);
    }
    findAll(req) {
        return this.groupsService.findAll(req.user.tenantId);
    }
    findOne(id, req) {
        return this.groupsService.findOne(id, req.user.tenantId);
    }
    update(id, dto, req) {
        return this.groupsService.update(id, dto, req.user.tenantId);
    }
    remove(id, req) {
        return this.groupsService.remove(id, req.user.tenantId);
    }
};
exports.LeadGroupsController = LeadGroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead group' }),
    (0, swagger_1.ApiBody)({ type: create_lead_group_dto_1.CreateLeadGroupDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Lead group created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_group_dto_1.CreateLeadGroupDto, Object]),
    __metadata("design:returntype", void 0)
], LeadGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all lead groups for tenant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead groups retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeadGroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific lead group with its leads' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Lead group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead group retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead group not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadGroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a lead group' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Lead group ID' }),
    (0, swagger_1.ApiBody)({ type: update_lead_group_dto_1.UpdateLeadGroupDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead group updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead group not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_group_dto_1.UpdateLeadGroupDto, Object]),
    __metadata("design:returntype", void 0)
], LeadGroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a lead group' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Lead group ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead group deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lead group not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadGroupsController.prototype, "remove", null);
exports.LeadGroupsController = LeadGroupsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('lead-groups'),
    (0, swagger_1.ApiTags)('Lead Groups'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [lead_groups_service_1.LeadGroupsService])
], LeadGroupsController);
//# sourceMappingURL=lead-groups.controller.js.map