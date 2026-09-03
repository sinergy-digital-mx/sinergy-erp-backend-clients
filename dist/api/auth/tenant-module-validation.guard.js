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
exports.TenantModuleValidationGuard = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rbac_1 = require("../../entities/rbac");
let TenantModuleValidationGuard = class TenantModuleValidationGuard {
    tenantModuleRepository;
    moduleRepository;
    constructor(tenantModuleRepository, moduleRepository) {
        this.tenantModuleRepository = tenantModuleRepository;
        this.moduleRepository = moduleRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.tenant_id) {
            return true;
        }
        const moduleCode = this.getModuleCodeFromRoute(request.url);
        if (!moduleCode) {
            return true;
        }
        const module = await this.moduleRepository.findOne({
            where: { code: moduleCode },
        });
        if (!module) {
            throw new common_1.ForbiddenException('Module not found');
        }
        const tenantModule = await this.tenantModuleRepository.findOne({
            where: {
                tenant_id: user.tenant_id,
                module_id: module.id,
                is_enabled: true,
            },
        });
        if (!tenantModule) {
            throw new common_1.ForbiddenException(`Module "${moduleCode}" is not enabled for your tenant`);
        }
        return true;
    }
    getModuleCodeFromRoute(url) {
        const match = url.match(/\/tenant\/([a-z-]+)/);
        if (!match) {
            return null;
        }
        const moduleCode = match[1].replace(/-/g, '_');
        return moduleCode;
    }
};
exports.TenantModuleValidationGuard = TenantModuleValidationGuard;
exports.TenantModuleValidationGuard = TenantModuleValidationGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rbac_1.TenantModule)),
    __param(1, (0, typeorm_1.InjectRepository)(rbac_1.Module)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TenantModuleValidationGuard);
//# sourceMappingURL=tenant-module-validation.guard.js.map