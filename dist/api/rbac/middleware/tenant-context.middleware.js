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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const tenant_context_service_1 = require("../services/tenant-context.service");
let TenantContextMiddleware = class TenantContextMiddleware {
    tenantContextService;
    constructor(tenantContextService) {
        this.tenantContextService = tenantContextService;
    }
    use(req, res, next) {
        const headerTenantId = req.headers['x-tenant-id'];
        const user = req.user;
        if (user) {
            const jwtTenantId = user.tenant_id;
            const userId = user.user_id;
            let effectiveTenantId;
            if (headerTenantId) {
                effectiveTenantId = headerTenantId;
            }
            else {
                effectiveTenantId = jwtTenantId;
            }
            if (!effectiveTenantId) {
                throw new common_1.UnauthorizedException('Tenant context is required');
            }
            this.tenantContextService.setTenantContext(effectiveTenantId, userId);
        }
        else if (headerTenantId) {
            this.tenantContextService.setTenantContext(headerTenantId, null);
        }
        next();
    }
};
exports.TenantContextMiddleware = TenantContextMiddleware;
exports.TenantContextMiddleware = TenantContextMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_context_service_1.TenantContextService])
], TenantContextMiddleware);
//# sourceMappingURL=tenant-context.middleware.js.map