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
exports.CustomerListSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_list_settings_entity_1 = require("../../../entities/customers/customer-list-settings.entity");
const customer_list_settings_util_1 = require("../utils/customer-list-settings.util");
const MISSING_TABLE_MESSAGE = 'Falta aplicar la actualización de base de datos del listado de clientes.';
let CustomerListSettingsService = class CustomerListSettingsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async get(tenantId) {
        try {
            const row = await this.repo.findOne({ where: { tenant_id: tenantId } });
            return (0, customer_list_settings_util_1.normalizeCustomerListSettings)(row ?? undefined);
        }
        catch (error) {
            if (this.isMissingTable(error)) {
                return (0, customer_list_settings_util_1.normalizeCustomerListSettings)(undefined);
            }
            throw error;
        }
    }
    async update(tenantId, userId, raw) {
        const settings = (0, customer_list_settings_util_1.normalizeCustomerListSettings)(raw);
        try {
            const existing = await this.repo.findOne({ where: { tenant_id: tenantId } });
            if (existing) {
                existing.prefilter = settings.prefilter;
                existing.updated_by = userId;
                await this.repo.save(existing);
            }
            else {
                await this.repo.save(this.repo.create({
                    tenant_id: tenantId,
                    prefilter: settings.prefilter,
                    updated_by: userId,
                }));
            }
            return settings;
        }
        catch (error) {
            if (this.isMissingTable(error)) {
                throw new common_1.BadRequestException(MISSING_TABLE_MESSAGE);
            }
            throw error;
        }
    }
    isMissingTable(error) {
        if (!(error instanceof typeorm_2.QueryFailedError))
            return false;
        const driver = error.driverError;
        return (driver?.code === 'ER_NO_SUCH_TABLE' ||
            String(driver?.message || error.message).includes("doesn't exist"));
    }
};
exports.CustomerListSettingsService = CustomerListSettingsService;
exports.CustomerListSettingsService = CustomerListSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_list_settings_entity_1.CustomerListSettings)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomerListSettingsService);
//# sourceMappingURL=customer-list-settings.service.js.map