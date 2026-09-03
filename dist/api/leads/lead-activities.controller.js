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
exports.LeadActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lead_activities_service_1 = require("./lead-activities.service");
const create_lead_activity_dto_1 = require("./dto/create-lead-activity.dto");
const update_lead_activity_dto_1 = require("./dto/update-lead-activity.dto");
const query_lead_activity_dto_1 = require("./dto/query-lead-activity.dto");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let LeadActivitiesController = class LeadActivitiesController {
    activitiesService;
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    async create(leadId, createActivityDto, req) {
        return this.activitiesService.create(leadId, createActivityDto, req.user.id, req.user.tenantId);
    }
    async findAll(leadId, query, req) {
        return this.activitiesService.findAll(leadId, query, req.user.tenantId);
    }
    async getActivitySummary(leadId, req) {
        return this.activitiesService.getActivitySummary(leadId, req.user.tenantId);
    }
    async findOne(leadId, id, req) {
        return this.activitiesService.findOne(leadId, id, req.user.tenantId);
    }
    async update(leadId, id, updateActivityDto, req) {
        return this.activitiesService.update(leadId, id, updateActivityDto, req.user.id, req.user.tenantId);
    }
    async remove(leadId, id, req) {
        await this.activitiesService.remove(leadId, id, req.user.id, req.user.tenantId);
        return { message: 'Activity deleted successfully' };
    }
};
exports.LeadActivitiesController = LeadActivitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Activity:Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead activity' }),
    (0, swagger_1.ApiParam)({ name: 'leadId', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiBody)({ type: create_lead_activity_dto_1.CreateLeadActivityDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Lead activity created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead does not exist' }),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_lead_activity_dto_1.CreateLeadActivityDto, Object]),
    __metadata("design:returntype", Promise)
], LeadActivitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Activity:Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get all activities for a lead' }),
    (0, swagger_1.ApiParam)({ name: 'leadId', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiQuery)({ type: query_lead_activity_dto_1.QueryLeadActivityDto, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of lead activities retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead does not exist' }),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_lead_activity_dto_1.QueryLeadActivityDto, Object]),
    __metadata("design:returntype", Promise)
], LeadActivitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Activity:Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity summary for a lead' }),
    (0, swagger_1.ApiParam)({ name: 'leadId', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead activity summary retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead does not exist' }),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], LeadActivitiesController.prototype, "getActivitySummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Activity:Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific lead activity by ID' }),
    (0, swagger_1.ApiParam)({ name: 'leadId', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Activity ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead activity retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead or activity does not exist' }),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], LeadActivitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Activity:Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update a lead activity' }),
    (0, swagger_1.ApiParam)({ name: 'leadId', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Activity ID (UUID)' }),
    (0, swagger_1.ApiBody)({ type: update_lead_activity_dto_1.UpdateLeadActivityDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead activity updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead or activity does not exist' }),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, update_lead_activity_dto_1.UpdateLeadActivityDto, Object]),
    __metadata("design:returntype", Promise)
], LeadActivitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Lead', action: 'Activity:Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a lead activity' }),
    (0, swagger_1.ApiParam)({ name: 'leadId', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'string', description: 'Activity ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead activity deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead or activity does not exist' }),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], LeadActivitiesController.prototype, "remove", null);
exports.LeadActivitiesController = LeadActivitiesController = __decorate([
    (0, common_1.Controller)('leads/:leadId/activities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, swagger_1.ApiTags)('Lead Activities'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [lead_activities_service_1.LeadActivitiesService])
], LeadActivitiesController);
//# sourceMappingURL=lead-activities.controller.js.map