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
exports.WhatsappWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const whatsapp_webhook_service_1 = require("./services/whatsapp-webhook.service");
let WhatsappWebhookController = class WhatsappWebhookController {
    service;
    constructor(service) {
        this.service = service;
    }
    async receive(req, body, hmac, algorithm) {
        const raw = req.rawBody ?? JSON.stringify(body);
        await this.service.handle(body, raw, hmac, algorithm);
        return { ok: true };
    }
};
exports.WhatsappWebhookController = WhatsappWebhookController;
__decorate([
    (0, common_1.Post)('waha'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-webhook-hmac')),
    __param(3, (0, common_1.Headers)('x-webhook-hmac-algorithm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], WhatsappWebhookController.prototype, "receive", null);
exports.WhatsappWebhookController = WhatsappWebhookController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('webhooks/whatsapp'),
    __metadata("design:paramtypes", [whatsapp_webhook_service_1.WhatsappWebhookService])
], WhatsappWebhookController);
//# sourceMappingURL=whatsapp-webhook.controller.js.map