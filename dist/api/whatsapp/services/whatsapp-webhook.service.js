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
var WhatsappWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappWebhookService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_util_1 = require("../utils/whatsapp.util");
const whatsapp_message_service_1 = require("./whatsapp-message.service");
const whatsapp_session_service_1 = require("./whatsapp-session.service");
let WhatsappWebhookService = WhatsappWebhookService_1 = class WhatsappWebhookService {
    sessions;
    messages;
    logger = new common_1.Logger(WhatsappWebhookService_1.name);
    constructor(sessions, messages) {
        this.sessions = sessions;
        this.messages = messages;
    }
    async handle(body, rawBody, hmac, algorithm) {
        const sessionName = typeof body?.session === 'string' ? body.session : '';
        const secret = (0, whatsapp_session_service_1.webhookSecret)();
        if (!sessionName || !secret)
            throw new common_1.UnauthorizedException('Firma inválida.');
        const key = (0, whatsapp_util_1.deriveWebhookKey)(secret, sessionName);
        if (!(0, whatsapp_util_1.verifyWebhookHmac)(rawBody, key, hmac, algorithm)) {
            this.logger.warn(`Webhook con firma inválida para la sesión ${sessionName}`);
            throw new common_1.UnauthorizedException('Firma inválida.');
        }
        switch (body.event) {
            case 'session.status': {
                const status = typeof body.payload?.status === 'string' ? body.payload.status : undefined;
                await this.sessions.applyWebhookStatus(sessionName, status, body.me);
                break;
            }
            case 'message.ack': {
                const payload = body.payload ?? {};
                const id = typeof payload.id === 'string' ? payload.id : null;
                if (!id || payload.fromMe === false)
                    break;
                const next = (0, whatsapp_util_1.ackToMessageStatus)(payload.ack, payload.ackName);
                if (next)
                    await this.messages.applyAck(sessionName, id, next);
                break;
            }
            default:
                break;
        }
    }
};
exports.WhatsappWebhookService = WhatsappWebhookService;
exports.WhatsappWebhookService = WhatsappWebhookService = WhatsappWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_session_service_1.WhatsappSessionService,
        whatsapp_message_service_1.WhatsappMessageService])
], WhatsappWebhookService);
//# sourceMappingURL=whatsapp-webhook.service.js.map