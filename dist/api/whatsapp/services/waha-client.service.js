"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WahaClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WahaClientService = exports.WahaError = void 0;
const common_1 = require("@nestjs/common");
class WahaError extends Error {
    status;
    detail;
    constructor(message, status, detail) {
        super(message);
        this.status = status;
        this.detail = detail;
    }
    get isNotFound() {
        return this.status === 404;
    }
    get isSessionUnavailable() {
        return this.status === 422 || this.status === 409;
    }
}
exports.WahaError = WahaError;
let WahaClientService = WahaClientService_1 = class WahaClientService {
    logger = new common_1.Logger(WahaClientService_1.name);
    isConfigured() {
        return !!this.baseUrl() && !!process.env.WAHA_API_KEY?.trim();
    }
    serverVersion() {
        return this.request('GET', '/api/server/version');
    }
    getSession(name) {
        return this.request('GET', `/api/sessions/${encodeURIComponent(name)}`);
    }
    createSession(name, config) {
        return this.request('POST', '/api/sessions', { name, start: true, config });
    }
    updateSession(name, config) {
        return this.request('PUT', `/api/sessions/${encodeURIComponent(name)}`, {
            name,
            config,
        });
    }
    async startSession(name) {
        await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/start`);
    }
    async stopSession(name) {
        await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/stop`);
    }
    async restartSession(name) {
        await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/restart`);
    }
    async logoutSession(name) {
        await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/logout`);
    }
    async deleteSession(name) {
        await this.request('DELETE', `/api/sessions/${encodeURIComponent(name)}`);
    }
    async getQr(name) {
        const response = await this.raw('GET', `/api/${encodeURIComponent(name)}/auth/qr?format=image`, undefined, { Accept: 'application/json' });
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.startsWith('image/')) {
            const buffer = Buffer.from(await response.arrayBuffer());
            return { mimetype: contentType.split(';')[0], data: buffer.toString('base64') };
        }
        const json = (await response.json().catch(() => null));
        if (!json?.data)
            throw new WahaError('Respuesta de QR inválida.', 502);
        return { mimetype: json.mimetype || 'image/png', data: json.data };
    }
    async requestPairingCode(name, phoneNumber) {
        const result = await this.request('POST', `/api/${encodeURIComponent(name)}/auth/request-code`, { phoneNumber });
        if (!result?.code)
            throw new WahaError('WAHA no devolvió el código.', 502);
        return result.code;
    }
    checkNumberExists(session, phone) {
        const query = new URLSearchParams({ phone, session });
        return this.request('GET', `/api/contacts/check-exists?${query.toString()}`);
    }
    async startTyping(session, chatId) {
        await this.request('POST', '/api/startTyping', { session, chatId });
    }
    async stopTyping(session, chatId) {
        await this.request('POST', '/api/stopTyping', { session, chatId });
    }
    sendText(session, chatId, text) {
        return this.request('POST', '/api/sendText', { session, chatId, text });
    }
    sendFile(session, chatId, file, caption) {
        return this.request('POST', '/api/sendFile', {
            session,
            chatId,
            file,
            ...(caption ? { caption } : {}),
        });
    }
    baseUrl() {
        return (process.env.WAHA_BASE_URL ?? '').trim().replace(/\/+$/, '');
    }
    async request(method, path, body) {
        const response = await this.raw(method, path, body);
        const text = await response.text();
        if (!text)
            return undefined;
        try {
            return JSON.parse(text);
        }
        catch {
            return text;
        }
    }
    async raw(method, path, body, extraHeaders = {}) {
        if (!this.isConfigured()) {
            throw new WahaError('El servicio de WhatsApp no está configurado.', 503);
        }
        let response;
        try {
            response = await fetch(`${this.baseUrl()}${path}`, {
                method,
                headers: {
                    Accept: 'application/json',
                    'X-Api-Key': process.env.WAHA_API_KEY.trim(),
                    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                    ...extraHeaders,
                },
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(30000),
            });
        }
        catch {
            this.logger.warn(`WAHA no respondió: ${method} ${path.split('?')[0]}`);
            throw new WahaError('El servicio de WhatsApp no respondió. Intenta de nuevo.', 503);
        }
        if (response.ok)
            return response;
        const detail = await response.text().catch(() => '');
        this.logger.warn(`WAHA ${response.status} en ${method} ${path.split('?')[0]}: ${detail.slice(0, 300)}`);
        throw new WahaError(`WAHA respondió ${response.status}`, response.status, detail.slice(0, 500));
    }
};
exports.WahaClientService = WahaClientService;
exports.WahaClientService = WahaClientService = WahaClientService_1 = __decorate([
    (0, common_1.Injectable)()
], WahaClientService);
//# sourceMappingURL=waha-client.service.js.map