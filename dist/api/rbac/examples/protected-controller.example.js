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
exports.MixedAccessController = exports.AdminController = exports.ProtectedCustomersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const permission_guard_1 = require("../guards/permission.guard");
const require_permissions_decorator_1 = require("../decorators/require-permissions.decorator");
let ProtectedCustomersController = class ProtectedCustomersController {
    async findAll(req) {
        return { message: 'Customer list', tenantId: req.user.tenant_id };
    }
    async findOne(id, req) {
        return { message: `Customer ${id}`, tenantId: req.user.tenant_id };
    }
    async create(createDto, req) {
        return { message: 'Customer created', tenantId: req.user.tenant_id };
    }
    async update(id, updateDto, req) {
        return { message: `Customer ${id} updated`, tenantId: req.user.tenant_id };
    }
    async remove(id, req) {
        return { message: `Customer ${id} deleted`, tenantId: req.user.tenant_id };
    }
    async bulkImport(importData, req) {
        return { message: 'Bulk import completed', tenantId: req.user.tenant_id };
    }
    async exportCustomers(req) {
        return { message: 'Customer export', tenantId: req.user.tenant_id };
    }
    async getDashboard(req) {
        return { message: 'Dashboard data', tenantId: req.user.tenant_id };
    }
};
exports.ProtectedCustomersController = ProtectedCustomersController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequireCustomerRead)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermission)('Customer', 'Read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequireCustomerCreate)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'Customer', action: 'Update' }, { entityType: 'Customer', action: 'Read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequireCustomerDelete)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, require_permissions_decorator_1.RequireAdmin)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, require_permissions_decorator_1.RequirePermission)('Customer', 'Export'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "exportCustomers", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, require_permissions_decorator_1.RequireReadOnly)('Customer', 'Lead', 'Order'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProtectedCustomersController.prototype, "getDashboard", null);
exports.ProtectedCustomersController = ProtectedCustomersController = __decorate([
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard)
], ProtectedCustomersController);
let AdminController = class AdminController {
    async getUsers(req) {
        return { message: 'User list', tenantId: req.user.tenant_id };
    }
    async createUser(createDto, req) {
        return { message: 'User created', tenantId: req.user.tenant_id };
    }
    async deleteUser(id, req) {
        return { message: `User ${id} deleted`, tenantId: req.user.tenant_id };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, require_permissions_decorator_1.RequirePermission)('User', 'Create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ entityType: 'User', action: 'Delete' }, { entityType: 'User', action: 'Read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permission_guard_1.PermissionGuard),
    (0, require_permissions_decorator_1.RequirePermission)('User', 'Read')
], AdminController);
let MixedAccessController = class MixedAccessController {
    async getPublicInfo() {
        return { message: 'Public information' };
    }
    async getProtectedInfo(req) {
        return { message: 'Protected information', tenantId: req.user.tenant_id };
    }
};
exports.MixedAccessController = MixedAccessController;
__decorate([
    (0, common_1.Get)('info'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MixedAccessController.prototype, "getPublicInfo", null);
__decorate([
    (0, common_1.Get)('protected'),
    (0, common_1.UseGuards)(permission_guard_1.PermissionGuard),
    (0, require_permissions_decorator_1.RequirePermission)('System', 'Read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MixedAccessController.prototype, "getProtectedInfo", null);
exports.MixedAccessController = MixedAccessController = __decorate([
    (0, common_1.Controller)('public'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
], MixedAccessController);
//# sourceMappingURL=protected-controller.example.js.map