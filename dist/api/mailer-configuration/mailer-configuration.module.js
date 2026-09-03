"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerConfigurationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mailer_configuration_entity_1 = require("../../entities/mailer-configuration/mailer-configuration.entity");
const mailer_configuration_service_1 = require("./services/mailer-configuration.service");
const encryption_service_1 = require("./services/encryption.service");
const audit_service_1 = require("./services/audit.service");
const mailer_configuration_repository_1 = require("./repositories/mailer-configuration.repository");
const mailer_configuration_controller_1 = require("./controllers/mailer-configuration.controller");
const mailer_configuration_rbac_guard_1 = require("./guards/mailer-configuration-rbac.guard");
const rbac_module_1 = require("../rbac/rbac.module");
let MailerConfigurationModule = class MailerConfigurationModule {
};
exports.MailerConfigurationModule = MailerConfigurationModule;
exports.MailerConfigurationModule = MailerConfigurationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([mailer_configuration_entity_1.MailerConfiguration]),
            rbac_module_1.RBACModule.forFeature(),
        ],
        controllers: [mailer_configuration_controller_1.MailerConfigurationController],
        providers: [
            mailer_configuration_service_1.MailerConfigurationService,
            encryption_service_1.MailerConfigurationEncryptionService,
            audit_service_1.AuditService,
            mailer_configuration_repository_1.MailerConfigurationRepository,
            mailer_configuration_rbac_guard_1.MailerConfigurationRbacGuard,
        ],
        exports: [mailer_configuration_service_1.MailerConfigurationService, encryption_service_1.MailerConfigurationEncryptionService],
    })
], MailerConfigurationModule);
//# sourceMappingURL=mailer-configuration.module.js.map