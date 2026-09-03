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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const update_lead_dto_1 = require("./dto/update-lead.dto");
const query_leads_dto_1 = require("./dto/query-leads.dto");
const paginated_leads_dto_1 = require("./dto/paginated-leads.dto");
const leads_stats_dto_1 = require("./dto/leads-stats.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permission_guard_1 = require("../rbac/guards/permission.guard");
const require_permissions_decorator_1 = require("../rbac/decorators/require-permissions.decorator");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    create(dto, req) {
        return this.leadsService.create(dto, req.user.tenantId);
    }
    update(id, dto, req) {
        return this.leadsService.update(id, dto, req.user.tenantId);
    }
    debugAuth(req) {
        return {
            message: 'JWT Auth working',
            user: req.user,
            timestamp: new Date().toISOString()
        };
    }
    getStats(req) {
        return this.leadsService.getStats(req.user.tenantId);
    }
    findAll(query, req) {
        return this.leadsService.findAll(req.user.tenantId, query);
    }
    findOne(id, req) {
        return this.leadsService.findOne(id, req.user.tenantId);
    }
    remove(id, req) {
        throw new Error('Delete functionality not yet implemented in service');
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Create' }),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead' }),
    (0, swagger_1.ApiBody)({ type: create_lead_dto_1.CreateLeadDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Lead created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Update' }),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing lead' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiBody)({ type: update_lead_dto_1.UpdateLeadDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead does not exist' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_lead_dto_1.UpdateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('debug'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Debug endpoint to test JWT authentication' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Debug info returned successfully' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "debugAuth", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get leads statistics overview' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Leads statistics retrieved successfully', type: leads_stats_dto_1.LeadsStatsDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get paginated leads with search functionality' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Search term for name, email, phone, or company' }),
    (0, swagger_1.ApiQuery)({ name: 'status_id', required: false, type: Number, description: 'Filter by status ID' }),
    (0, swagger_1.ApiQuery)({ name: 'email_contacted', required: false, type: Boolean, description: 'Filter by email contact status' }),
    (0, swagger_1.ApiQuery)({ name: 'customer_answered', required: false, type: Boolean, description: 'Filter by customer response status' }),
    (0, swagger_1.ApiQuery)({ name: 'contacted_no_reply', required: false, type: Boolean, description: 'Filter for leads contacted but customer has not replied' }),
    (0, swagger_1.ApiQuery)({ name: 'awaiting_agent_reply', required: false, type: Boolean, description: 'Filter for leads where customer replied but agent has not replied back' }),
    (0, swagger_1.ApiQuery)({ name: 'agent_replied_back', required: false, type: Boolean, description: 'Filter by agent reply status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of leads retrieved successfully', type: paginated_leads_dto_1.PaginatedLeadsDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_leads_dto_1.QueryLeadsDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Read' }),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific lead by ID with addresses and activities' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead with addresses and activities retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead does not exist' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'leads', action: 'Delete' }),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a lead by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: 'number', description: 'Lead ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lead deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid or missing token' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found - Lead does not exist' }),
    (0, swagger_1.ApiResponse)({ status: 501, description: 'Not implemented - Delete functionality not yet available' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "remove", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, common_1.Controller)('leads'),
    (0, swagger_1.ApiTags)('Leads'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map