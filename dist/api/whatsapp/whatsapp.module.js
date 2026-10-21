"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const whatsapp_message_entity_1 = require("../../entities/whatsapp/whatsapp-message.entity");
const whatsapp_session_entity_1 = require("../../entities/whatsapp/whatsapp-session.entity");
const auth_module_1 = require("../auth/auth.module");
const rbac_module_1 = require("../rbac/rbac.module");
const waha_client_service_1 = require("./services/waha-client.service");
const whatsapp_message_service_1 = require("./services/whatsapp-message.service");
const whatsapp_session_service_1 = require("./services/whatsapp-session.service");
const whatsapp_webhook_service_1 = require("./services/whatsapp-webhook.service");
const whatsapp_controller_1 = require("./whatsapp.controller");
const whatsapp_webhook_controller_1 = require("./whatsapp-webhook.controller");
let WhatsappModule = class WhatsappModule {
};
exports.WhatsappModule = WhatsappModule;
exports.WhatsappModule = WhatsappModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([whatsapp_session_entity_1.WhatsappSession, whatsapp_message_entity_1.WhatsappMessage]), auth_module_1.AuthModule, rbac_module_1.RBACModule],
        controllers: [whatsapp_controller_1.WhatsappController, whatsapp_webhook_controller_1.WhatsappWebhookController],
        providers: [
            waha_client_service_1.WahaClientService,
            whatsapp_session_service_1.WhatsappSessionService,
            whatsapp_message_service_1.WhatsappMessageService,
            whatsapp_webhook_service_1.WhatsappWebhookService,
        ],
        exports: [whatsapp_message_service_1.WhatsappMessageService, whatsapp_session_service_1.WhatsappSessionService],
    })
], WhatsappModule);
//# sourceMappingURL=whatsapp.module.js.map