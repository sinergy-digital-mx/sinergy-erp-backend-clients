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
var MailerConfigurationRbacGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailerConfigurationRbacGuard = void 0;
const common_1 = require("@nestjs/common");
const mailer_configuration_service_1 = require("../services/mailer-configuration.service");
let MailerConfigurationRbacGuard = MailerConfigurationRbacGuard_1 = class MailerConfigurationRbacGuard {
    service;
    logger = new common_1.Logger(MailerConfigurationRbacGuard_1.name);
    constructor(service) {
        this.service = service;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const configId = request.params.id;
        if (!configId) {
            return true;
        }
        if (!user || !user.tenant_id) {
            this.logger.warn('No user or tenant context found in request');
            throw new common_1.ForbiddenException('Tenant context is required');
        }
        try {
            const config = await this.service.findById(user.tenant_id, configId);
            if (!config) {
                this.logger.warn(`Configuration ${configId} not found for tenant ${user.tenant_id}`);
                throw new common_1.ForbiddenException('Configuration not found or access denied');
            }
            request.mailerConfiguration = config;
            return true;
        }
        catch (error) {
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`Error verifying configuration ownership: ${error.message}`, error.stack);
            throw new common_1.ForbiddenException('Failed to verify configuration access');
        }
    }
};
exports.MailerConfigurationRbacGuard = MailerConfigurationRbacGuard;
exports.MailerConfigurationRbacGuard = MailerConfigurationRbacGuard = MailerConfigurationRbacGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_configuration_service_1.MailerConfigurationService])
], MailerConfigurationRbacGuard);
//# sourceMappingURL=mailer-configuration-rbac.guard.js.map