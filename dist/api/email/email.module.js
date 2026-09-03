"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const email_thread_entity_1 = require("../../entities/email/email-thread.entity");
const email_message_entity_1 = require("../../entities/email/email-message.entity");
const email_thread_service_1 = require("./services/email-thread.service");
const email_message_service_1 = require("./services/email-message.service");
const gmail_send_service_1 = require("./services/gmail-send.service");
const email_thread_controller_1 = require("./controllers/email-thread.controller");
const lead_entity_1 = require("../../entities/leads/lead.entity");
const rbac_module_1 = require("../rbac/rbac.module");
const third_party_config_entity_1 = require("../../entities/integrations/third-party-config.entity");
const encryption_service_1 = require("../integrations/services/encryption.service");
const entity_registry_entity_1 = require("../../entities/entity-registry/entity-registry.entity");
let EmailModule = class EmailModule {
};
exports.EmailModule = EmailModule;
exports.EmailModule = EmailModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([email_thread_entity_1.EmailThread, email_message_entity_1.EmailMessage, lead_entity_1.Lead, third_party_config_entity_1.ThirdPartyConfig, entity_registry_entity_1.EntityRegistry]),
            rbac_module_1.RBACModule,
        ],
        providers: [email_thread_service_1.EmailThreadService, email_message_service_1.EmailMessageService, gmail_send_service_1.GmailSendService, encryption_service_1.EncryptionService],
        controllers: [email_thread_controller_1.EmailThreadController],
        exports: [email_thread_service_1.EmailThreadService, email_message_service_1.EmailMessageService, gmail_send_service_1.GmailSendService],
    })
], EmailModule);
//# sourceMappingURL=email.module.js.map