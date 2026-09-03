"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const third_party_config_entity_1 = require("../../entities/integrations/third-party-config.entity");
const third_party_config_service_1 = require("./services/third-party-config.service");
const encryption_service_1 = require("./services/encryption.service");
const third_party_config_controller_1 = require("./controllers/third-party-config.controller");
const rbac_module_1 = require("../rbac/rbac.module");
let IntegrationsModule = class IntegrationsModule {
};
exports.IntegrationsModule = IntegrationsModule;
exports.IntegrationsModule = IntegrationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([third_party_config_entity_1.ThirdPartyConfig]), rbac_module_1.RBACModule],
        providers: [third_party_config_service_1.ThirdPartyConfigService, encryption_service_1.EncryptionService],
        controllers: [third_party_config_controller_1.ThirdPartyConfigController],
        exports: [third_party_config_service_1.ThirdPartyConfigService, encryption_service_1.EncryptionService],
    })
], IntegrationsModule);
//# sourceMappingURL=integrations.module.js.map