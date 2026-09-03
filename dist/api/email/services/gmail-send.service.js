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
var GmailSendService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailSendService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const googleapis_1 = require("googleapis");
const email_message_service_1 = require("./email-message.service");
const third_party_config_entity_1 = require("../../../entities/integrations/third-party-config.entity");
const encryption_service_1 = require("../../integrations/services/encryption.service");
let GmailSendService = GmailSendService_1 = class GmailSendService {
    configRepo;
    emailMessageService;
    encryptionService;
    logger = new common_1.Logger(GmailSendService_1.name);
    constructor(configRepo, emailMessageService, encryptionService) {
        this.configRepo = configRepo;
        this.emailMessageService = emailMessageService;
        this.encryptionService = encryptionService;
    }
    async sendViaGmail(tenantId, threadId, fromEmail, toEmail, subject, body, bodyHtml, cc, bcc) {
        this.logger.log(`Enviando email a través de Gmail: ${toEmail}`);
        const config = await this.configRepo.findOne({
            where: { tenant_id: tenantId, provider: 'gmail' },
        });
        if (!config) {
            throw new common_1.BadRequestException('Gmail no está configurado para este tenant');
        }
        if (!config.is_enabled) {
            throw new common_1.BadRequestException('Gmail está deshabilitado para este tenant');
        }
        await this.refreshAccessTokenIfNeeded(config);
        try {
            const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
            const clientSecret = config.encrypted_api_secret
                ? this.encryptionService.decrypt(config.encrypted_api_secret)
                : '';
            const refreshToken = config.metadata.refresh_token;
            const accessToken = config.metadata.access_token;
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
            const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
            const message = this.createEmailMessage(fromEmail, toEmail, subject, body, bodyHtml, cc, bcc);
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: Buffer.from(message).toString('base64'),
                },
            });
            const gmailMessageId = response.data.id;
            if (!gmailMessageId) {
                throw new common_1.BadRequestException('No message ID returned from Gmail');
            }
            this.logger.log(`Email enviado exitosamente. Gmail ID: ${gmailMessageId}`);
            await this.emailMessageService.sendMessage(tenantId, threadId, fromEmail, toEmail, subject, body, bodyHtml, cc, bcc);
            return gmailMessageId;
        }
        catch (error) {
            this.logger.error(`Error enviando email con Gmail: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`Error al enviar email con Gmail: ${error.message}`);
        }
    }
    createEmailMessage(from, to, subject, body, bodyHtml, cc, bcc) {
        const headers = [
            `From: ${from}`,
            `To: ${to}`,
        ];
        if (cc) {
            headers.push(`Cc: ${cc}`);
        }
        if (bcc) {
            headers.push(`Bcc: ${bcc}`);
        }
        headers.push(`Subject: ${subject}`);
        headers.push('MIME-Version: 1.0');
        if (bodyHtml) {
            headers.push('Content-Type: text/html; charset="UTF-8"');
        }
        else {
            headers.push('Content-Type: text/plain; charset="UTF-8"');
        }
        return headers.join('\r\n') + '\r\n\r\n' + (bodyHtml || body);
    }
    async refreshAccessTokenIfNeeded(config) {
        const expiresAt = new Date(config.metadata.expires_at);
        const now = new Date();
        if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
            this.logger.log('Refrescando access token de Gmail...');
            try {
                const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
                const clientSecret = config.encrypted_api_secret
                    ? this.encryptionService.decrypt(config.encrypted_api_secret)
                    : '';
                const refreshToken = config.metadata.refresh_token;
                const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const { credentials } = await oauth2Client.refreshAccessToken();
                config.metadata.access_token = credentials.access_token;
                if (credentials.expiry_date) {
                    config.metadata.expires_at = new Date(credentials.expiry_date).toISOString();
                }
                await this.configRepo.save(config);
                this.logger.log('Access token refrescado exitosamente');
            }
            catch (error) {
                this.logger.error(`Error refrescando token: ${error.message}`, error.stack);
                throw new common_1.BadRequestException(`Error refrescando token de Gmail: ${error.message}`);
            }
        }
    }
    async getGmailConfig(tenantId) {
        const config = await this.configRepo.findOne({
            where: { tenant_id: tenantId, provider: 'gmail' },
        });
        if (!config) {
            throw new common_1.BadRequestException('Gmail no está configurado para este tenant');
        }
        return config;
    }
    async isGmailConfigured(tenantId) {
        const config = await this.configRepo.findOne({
            where: { tenant_id: tenantId, provider: 'gmail' },
        });
        return config !== null && config.is_enabled;
    }
    async testGmailConfig(tenantId) {
        try {
            const config = await this.getGmailConfig(tenantId);
            if (!config.is_enabled) {
                return { success: false, message: 'Gmail está deshabilitado' };
            }
            await this.refreshAccessTokenIfNeeded(config);
            const clientId = this.encryptionService.decrypt(config.encrypted_api_key);
            const clientSecret = config.encrypted_api_secret
                ? this.encryptionService.decrypt(config.encrypted_api_secret)
                : '';
            const accessToken = config.metadata.access_token;
            const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ access_token: accessToken });
            const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
            await gmail.users.getProfile({ userId: 'me' });
            this.logger.log('Configuración de Gmail verificada exitosamente');
            return { success: true, message: 'Configuración de Gmail es válida' };
        }
        catch (error) {
            this.logger.error(`Error probando Gmail: ${error.message}`, error.stack);
            return { success: false, message: `Error: ${error.message}` };
        }
    }
};
exports.GmailSendService = GmailSendService;
exports.GmailSendService = GmailSendService = GmailSendService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(third_party_config_entity_1.ThirdPartyConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        email_message_service_1.EmailMessageService,
        encryption_service_1.EncryptionService])
], GmailSendService);
//# sourceMappingURL=gmail-send.service.js.map