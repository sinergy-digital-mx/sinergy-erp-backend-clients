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
exports.MailerConfigurationRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const mailer_configuration_entity_1 = require("../../../entities/mailer-configuration/mailer-configuration.entity");
let MailerConfigurationRepository = class MailerConfigurationRepository extends typeorm_1.Repository {
    dataSource;
    constructor(dataSource) {
        super(mailer_configuration_entity_1.MailerConfiguration, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    async findByTenantAndId(tenantId, configId) {
        return this.findOne({
            where: {
                id: configId,
                tenant_id: tenantId,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
    }
    async findActiveByTenant(tenantId) {
        return this.findOne({
            where: {
                tenant_id: tenantId,
                is_active: true,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
    }
    async findByTenant(tenantId) {
        return this.find({
            where: {
                tenant_id: tenantId,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
            order: {
                created_at: 'DESC',
            },
        });
    }
    async findByTenantAndName(tenantId, name) {
        return this.findOne({
            where: {
                tenant_id: tenantId,
                name,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
    }
    async deactivateAllByTenant(tenantId) {
        const result = await this.update({
            tenant_id: tenantId,
            is_active: true,
        }, {
            is_active: false,
        });
        return result.affected || 0;
    }
};
exports.MailerConfigurationRepository = MailerConfigurationRepository;
exports.MailerConfigurationRepository = MailerConfigurationRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], MailerConfigurationRepository);
//# sourceMappingURL=mailer-configuration.repository.js.map