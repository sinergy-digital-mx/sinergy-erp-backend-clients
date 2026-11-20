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
exports.LogisticsRoutesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const logistics_route_entity_1 = require("../../entities/logistics/logistics-route.entity");
const module_entity_1 = require("../../entities/rbac/module.entity");
const tenant_module_entity_1 = require("../../entities/rbac/tenant-module.entity");
const MODULE_CODE = 'logistics_routes';
let LogisticsRoutesService = class LogisticsRoutesService {
    routes;
    modules;
    tenantModules;
    constructor(routes, modules, tenantModules) {
        this.routes = routes;
        this.modules = modules;
        this.tenantModules = tenantModules;
    }
    async isEnabled(tenantId) {
        try {
            const module = await this.modules.findOne({ where: { code: MODULE_CODE } });
            if (!module)
                return false;
            const row = await this.tenantModules.findOne({
                where: { tenant_id: tenantId, module_id: module.id, is_enabled: true },
            });
            return !!row;
        }
        catch (error) {
            if (this.isMissingTable(error))
                return false;
            throw error;
        }
    }
    async setEnabled(tenantId, enabled) {
        const module = await this.modules.findOne({ where: { code: MODULE_CODE } });
        if (!module) {
            throw new common_1.BadRequestException('Falta aplicar la actualización de base de datos de rutas');
        }
        const existing = await this.tenantModules.findOne({
            where: { tenant_id: tenantId, module_id: module.id },
        });
        if (existing) {
            existing.is_enabled = enabled;
            await this.tenantModules.save(existing);
        }
        else {
            await this.tenantModules.save(this.tenantModules.create({
                tenant_id: tenantId,
                module_id: module.id,
                is_enabled: enabled,
            }));
        }
        return enabled;
    }
    async list(tenantId, activeOnly = false) {
        if (!(await this.isEnabled(tenantId)))
            return [];
        return this.routes.find({
            where: { tenant_id: tenantId, ...(activeOnly ? { is_active: true } : {}) },
            order: { name: 'ASC' },
        });
    }
    async create(tenantId, dto) {
        await this.assertEnabled(tenantId);
        try {
            return await this.routes.save(this.routes.create({
                tenant_id: tenantId,
                name: dto.name,
                code: dto.code,
                description: dto.description ?? null,
                is_active: dto.is_active !== false,
            }));
        }
        catch (error) {
            if (this.isDuplicate(error)) {
                throw new common_1.BadRequestException('Ya existe una ruta con ese código');
            }
            throw error;
        }
    }
    async update(tenantId, id, dto) {
        await this.assertEnabled(tenantId);
        const row = await this.routes.findOne({ where: { id, tenant_id: tenantId } });
        if (!row)
            throw new common_1.NotFoundException('Ruta no encontrada');
        row.name = dto.name;
        row.code = dto.code;
        row.description = dto.description ?? null;
        if (dto.is_active != null)
            row.is_active = dto.is_active;
        try {
            return await this.routes.save(row);
        }
        catch (error) {
            if (this.isDuplicate(error)) {
                throw new common_1.BadRequestException('Ya existe una ruta con ese código');
            }
            throw error;
        }
    }
    async deactivate(tenantId, id) {
        await this.assertEnabled(tenantId);
        const row = await this.routes.findOne({ where: { id, tenant_id: tenantId } });
        if (!row)
            throw new common_1.NotFoundException('Ruta no encontrada');
        row.is_active = false;
        return this.routes.save(row);
    }
    async assertActive(tenantId, routeId) {
        if (!routeId)
            return;
        if (!(await this.isEnabled(tenantId))) {
            throw new common_1.BadRequestException('Las rutas no están activas');
        }
        const row = await this.routes.findOne({
            where: { id: routeId, tenant_id: tenantId, is_active: true },
        });
        if (!row)
            throw new common_1.BadRequestException('La ruta no está activa');
    }
    async assertEnabled(tenantId) {
        if (!(await this.isEnabled(tenantId))) {
            throw new common_1.BadRequestException('Las rutas no están activas');
        }
    }
    isMissingTable(error) {
        if (!(error instanceof typeorm_2.QueryFailedError))
            return false;
        const driver = error.driverError;
        return driver?.code === 'ER_NO_SUCH_TABLE' || String(driver?.message || '').includes("doesn't exist");
    }
    isDuplicate(error) {
        const driver = error?.driverError;
        return driver?.code === 'ER_DUP_ENTRY';
    }
};
exports.LogisticsRoutesService = LogisticsRoutesService;
exports.LogisticsRoutesService = LogisticsRoutesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(logistics_route_entity_1.LogisticsRoute)),
    __param(1, (0, typeorm_1.InjectRepository)(module_entity_1.Module)),
    __param(2, (0, typeorm_1.InjectRepository)(tenant_module_entity_1.TenantModule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LogisticsRoutesService);
//# sourceMappingURL=logistics-routes.service.js.map