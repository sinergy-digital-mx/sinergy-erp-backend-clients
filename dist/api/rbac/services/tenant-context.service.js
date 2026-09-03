"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextService = void 0;
const common_1 = require("@nestjs/common");
let TenantContextService = class TenantContextService {
    tenantId = null;
    userId = null;
    setTenantContext(tenantId, userId) {
        this.tenantId = tenantId;
        this.userId = userId;
    }
    getCurrentTenantId() {
        return this.tenantId;
    }
    getCurrentUserId() {
        return this.userId;
    }
    hasContext() {
        return this.tenantId !== null && this.userId !== null;
    }
    clearContext() {
        this.tenantId = null;
        this.userId = null;
    }
    validateContext(expectedTenantId, expectedUserId) {
        if (expectedTenantId && this.tenantId !== expectedTenantId) {
            return false;
        }
        if (expectedUserId && this.userId !== expectedUserId) {
            return false;
        }
        return this.hasContext();
    }
};
exports.TenantContextService = TenantContextService;
exports.TenantContextService = TenantContextService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST })
], TenantContextService);
//# sourceMappingURL=tenant-context.service.js.map