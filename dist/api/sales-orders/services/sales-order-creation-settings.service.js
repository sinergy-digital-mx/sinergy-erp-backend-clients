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
exports.SalesOrderCreationSettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sales_order_creation_settings_entity_1 = require("../../../entities/sales-orders/sales-order-creation-settings.entity");
const sales_order_creation_settings_util_1 = require("../utils/sales-order-creation-settings.util");
const MISSING_TABLE_MESSAGE = 'Falta aplicar la actualización de base de datos de la configuración de órdenes de venta.';
let SalesOrderCreationSettingsService = class SalesOrderCreationSettingsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async get(tenantId) {
        try {
            const row = await this.repo.findOne({ where: { tenant_id: tenantId } });
            return { fields: (0, sales_order_creation_settings_util_1.normalizeSalesOrderCreationFields)(row?.fields) };
        }
        catch (error) {
            if (this.isMissingTable(error)) {
                return { fields: (0, sales_order_creation_settings_util_1.normalizeSalesOrderCreationFields)(undefined) };
            }
            throw error;
        }
    }
    async update(tenantId, userId, rawFields) {
        const fields = (0, sales_order_creation_settings_util_1.normalizeSalesOrderCreationFields)(rawFields);
        try {
            const existing = await this.repo.findOne({ where: { tenant_id: tenantId } });
            if (existing) {
                existing.fields = fields;
                existing.updated_by = userId;
                await this.repo.save(existing);
            }
            else {
                await this.repo.save(this.repo.create({
                    tenant_id: tenantId,
                    fields,
                    updated_by: userId,
                }));
            }
            return { fields };
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
        return driver?.code === 'ER_NO_SUCH_TABLE' || String(driver?.message || error.message).includes("doesn't exist");
    }
};
exports.SalesOrderCreationSettingsService = SalesOrderCreationSettingsService;
exports.SalesOrderCreationSettingsService = SalesOrderCreationSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sales_order_creation_settings_entity_1.SalesOrderCreationSettings)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SalesOrderCreationSettingsService);
//# sourceMappingURL=sales-order-creation-settings.service.js.map