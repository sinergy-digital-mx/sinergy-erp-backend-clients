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
var WhatsappSessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappSessionService = void 0;
exports.webhookSecret = webhookSecret;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const whatsapp_session_entity_1 = require("../../../entities/whatsapp/whatsapp-session.entity");
const whatsapp_constants_1 = require("../whatsapp.constants");
const whatsapp_util_1 = require("../utils/whatsapp.util");
const whatsapp_errors_1 = require("../utils/whatsapp-errors");
const waha_client_service_1 = require("./waha-client.service");
const TIER_CACHE_MS = 5 * 60 * 1000;
let WhatsappSessionService = WhatsappSessionService_1 = class WhatsappSessionService {
    sessionRepo;
    waha;
    logger = new common_1.Logger(WhatsappSessionService_1.name);
    modeCache = null;
    constructor(sessionRepo, waha) {
        this.sessionRepo = sessionRepo;
        this.waha = waha;
    }
    async getStatus(tenantId) {
        const row = await this.findByTenant(tenantId);
        if (!row)
            return this.emptyView();
        return this.refresh(row);
    }
    async connect(tenantId, userId) {
        this.assertServiceConfigured();
        try {
            const row = await this.ensureRow(tenantId, userId);
            let session = await this.fetchSession(row.session_name);
            const config = this.sessionConfig(row);
            if (!session) {
                session = await this.waha.createSession(row.session_name, config);
            }
            else if (session.status === whatsapp_constants_1.WAHA_SESSION_STATUS.STOPPED ||
                session.status === whatsapp_constants_1.WAHA_SESSION_STATUS.FAILED) {
                await this.waha.updateSession(row.session_name, config).catch((error) => {
                    this.logger.warn(`No se pudo actualizar la sesión ${row.session_name}: ${error?.status}`);
                });
                await this.waha.startSession(row.session_name);
                session = (await this.fetchSession(row.session_name)) ?? session;
            }
            row.updated_by = userId;
            await this.applySession(row, session);
            return this.toView(row, true);
        }
        catch (error) {
            throw (0, whatsapp_errors_1.toHttpException)(error);
        }
    }
    async qr(tenantId) {
        const row = await this.requireRow(tenantId);
        try {
            const session = await this.fetchSession(row.session_name);
            if (!session) {
                await this.markMissing(row);
                return { ...this.toView(row, true), qr_data_url: null };
            }
            await this.applySession(row, session);
            let qrDataUrl = null;
            if (session.status === whatsapp_constants_1.WAHA_SESSION_STATUS.SCAN_QR_CODE) {
                const qr = await this.waha.getQr(row.session_name);
                qrDataUrl = `data:${qr.mimetype};base64,${qr.data}`;
            }
            return { ...this.toView(row, true), qr_data_url: qrDataUrl };
        }
        catch (error) {
            throw (0, whatsapp_errors_1.toHttpException)(error);
        }
    }
    async pairingCode(tenantId, phone) {
        const row = await this.requireRow(tenantId);
        const normalized = (0, whatsapp_util_1.normalizeWhatsappPhone)(phone);
        if (!normalized)
            throw new common_1.BadRequestException('Indica un número de teléfono válido.');
        try {
            const session = await this.fetchSession(row.session_name);
            if (!session || session.status !== whatsapp_constants_1.WAHA_SESSION_STATUS.SCAN_QR_CODE) {
                throw new common_1.BadRequestException('Primero inicia la conexión y espera a que aparezca el código QR.');
            }
            const code = await this.waha.requestPairingCode(row.session_name, normalized);
            return { code };
        }
        catch (error) {
            throw (0, whatsapp_errors_1.toHttpException)(error);
        }
    }
    async restart(tenantId, userId) {
        const row = await this.requireRow(tenantId);
        try {
            await this.waha.restartSession(row.session_name);
            const session = await this.fetchSession(row.session_name);
            row.updated_by = userId;
            if (session)
                await this.applySession(row, session);
            return this.toView(row, true);
        }
        catch (error) {
            throw (0, whatsapp_errors_1.toHttpException)(error);
        }
    }
    async logout(tenantId, userId) {
        const row = await this.requireRow(tenantId);
        try {
            await this.waha.logoutSession(row.session_name).catch((error) => {
                if (!(error instanceof waha_client_service_1.WahaError) || !(error.isNotFound || error.isSessionUnavailable)) {
                    throw error;
                }
            });
        }
        catch (error) {
            throw (0, whatsapp_errors_1.toHttpException)(error);
        }
        row.status = whatsapp_constants_1.WAHA_SESSION_STATUS.STOPPED;
        row.phone_number = null;
        row.push_name = null;
        row.connected_at = null;
        row.last_status_at = new Date();
        row.last_error = null;
        row.updated_by = userId;
        await this.sessionRepo.save(row);
        return this.toView(row, true);
    }
    async remove(tenantId) {
        const row = await this.findByTenant(tenantId);
        if (!row)
            return;
        try {
            await this.waha.logoutSession(row.session_name).catch(() => undefined);
            await this.waha.deleteSession(row.session_name).catch((error) => {
                if (!(error instanceof waha_client_service_1.WahaError) || !error.isNotFound)
                    throw error;
            });
        }
        catch (error) {
            throw (0, whatsapp_errors_1.toHttpException)(error);
        }
        await this.sessionRepo.remove(row);
    }
    async requireConnected(tenantId) {
        const row = await this.findByTenant(tenantId);
        if (!row || row.status !== whatsapp_constants_1.WAHA_SESSION_STATUS.WORKING) {
            throw new common_1.BadRequestException(whatsapp_errors_1.WHATSAPP_NOT_CONNECTED_MESSAGE);
        }
        return row;
    }
    findBySessionName(sessionName) {
        return this.sessionRepo.findOne({ where: { session_name: sessionName } });
    }
    async applyWebhookStatus(sessionName, status, me) {
        if (!status)
            return;
        const row = await this.findBySessionName(sessionName);
        if (!row)
            return;
        await this.applySession(row, { name: sessionName, status, me });
    }
    async markUnavailable(sessionName, reason) {
        await this.sessionRepo.update({ session_name: sessionName }, { status: whatsapp_constants_1.WAHA_SESSION_STATUS.STOPPED, connected_at: null, last_error: reason.slice(0, 500) });
    }
    async mode() {
        const forced = (process.env.WAHA_SESSION_MODE ?? '').trim().toLowerCase();
        if (forced === 'single' || forced === 'multi')
            return forced;
        if (this.modeCache && this.modeCache.expiresAt > Date.now())
            return this.modeCache.mode;
        const version = await this.waha.serverVersion();
        const mode = (0, whatsapp_util_1.supportsMultipleSessions)(version) ? 'multi' : 'single';
        this.modeCache = { mode, expiresAt: Date.now() + TIER_CACHE_MS };
        return mode;
    }
    findByTenant(tenantId) {
        return this.sessionRepo.findOne({ where: { tenant_id: tenantId } });
    }
    async requireRow(tenantId) {
        const row = await this.findByTenant(tenantId);
        if (!row)
            throw new common_1.BadRequestException('Primero conecta WhatsApp en Configuración.');
        return row;
    }
    async ensureRow(tenantId, userId) {
        const existing = await this.findByTenant(tenantId);
        if (existing)
            return existing;
        const mode = await this.mode();
        let sessionName = (0, whatsapp_util_1.buildSessionName)(tenantId);
        if (mode === 'single') {
            sessionName = whatsapp_constants_1.WAHA_CORE_SESSION_NAME;
            const taken = await this.findBySessionName(sessionName);
            if (taken && taken.tenant_id !== tenantId) {
                throw new common_1.ConflictException('El servicio de WhatsApp compartido ya está asignado a otra organización.');
            }
        }
        try {
            return await this.sessionRepo.save(this.sessionRepo.create({
                tenant_id: tenantId,
                session_name: sessionName,
                status: whatsapp_constants_1.WAHA_SESSION_STATUS.STOPPED,
                created_by: userId,
                updated_by: userId,
            }));
        }
        catch (error) {
            const created = await this.findByTenant(tenantId);
            if (created)
                return created;
            throw error;
        }
    }
    async fetchSession(name) {
        try {
            return await this.waha.getSession(name);
        }
        catch (error) {
            if (error instanceof waha_client_service_1.WahaError && error.isNotFound)
                return null;
            throw error;
        }
    }
    async refresh(row) {
        if (!this.waha.isConfigured())
            return this.toView(row, false);
        try {
            const session = await this.fetchSession(row.session_name);
            if (!session) {
                await this.markMissing(row);
            }
            else {
                await this.applySession(row, session);
            }
            return this.toView(row, true);
        }
        catch (error) {
            this.logger.warn(`No se pudo sincronizar ${row.session_name}: ${(0, whatsapp_errors_1.friendlyWahaMessage)(error)}`);
            return this.toView(row, false);
        }
    }
    async markMissing(row) {
        row.status = whatsapp_constants_1.WAHA_SESSION_STATUS.STOPPED;
        row.phone_number = null;
        row.push_name = null;
        row.connected_at = null;
        row.last_status_at = new Date();
        await this.sessionRepo.save(row);
    }
    async applySession(row, session) {
        const previous = row.status;
        row.status = session.status;
        row.last_status_at = new Date();
        if (session.status === whatsapp_constants_1.WAHA_SESSION_STATUS.WORKING) {
            row.phone_number = (0, whatsapp_util_1.phoneFromWahaId)(session.me?.id) ?? row.phone_number;
            row.push_name = session.me?.pushName ?? row.push_name;
            if (previous !== whatsapp_constants_1.WAHA_SESSION_STATUS.WORKING || !row.connected_at) {
                row.connected_at = new Date();
            }
            row.last_error = null;
        }
        else {
            row.connected_at = null;
            if (session.status === whatsapp_constants_1.WAHA_SESSION_STATUS.SCAN_QR_CODE) {
                row.phone_number = null;
                row.push_name = null;
            }
            if (session.status === whatsapp_constants_1.WAHA_SESSION_STATUS.FAILED) {
                row.last_error = 'La sesión de WhatsApp falló. Vuelve a conectar.';
            }
        }
        await this.sessionRepo.save(row);
    }
    sessionConfig(row) {
        const config = {
            metadata: { 'erp.tenant_id': row.tenant_id },
        };
        const baseUrl = (process.env.WAHA_WEBHOOK_BASE_URL ?? '').trim().replace(/\/+$/, '');
        const secret = webhookSecret();
        if (baseUrl && secret) {
            config.webhooks = [
                {
                    url: `${baseUrl}${whatsapp_constants_1.WAHA_WEBHOOK_PATH}`,
                    events: whatsapp_constants_1.WAHA_WEBHOOK_EVENTS,
                    hmac: { key: (0, whatsapp_util_1.deriveWebhookKey)(secret, row.session_name) },
                    retries: { policy: 'exponential', delaySeconds: 2, attempts: 6 },
                },
            ];
        }
        else {
            this.logger.warn('Sin WAHA_WEBHOOK_BASE_URL o secreto: no se recibirán eventos de estado ni confirmaciones.');
        }
        return config;
    }
    assertServiceConfigured() {
        if (!this.waha.isConfigured()) {
            throw (0, whatsapp_errors_1.toHttpException)(new waha_client_service_1.WahaError('El servicio de WhatsApp no está configurado.', 503));
        }
    }
    emptyView() {
        return {
            configured: false,
            service_available: this.waha.isConfigured(),
            state: 'not_configured',
            status: null,
            phone_number: null,
            push_name: null,
            connected_at: null,
            last_status_at: null,
            last_error: null,
        };
    }
    toView(row, serviceAvailable) {
        return {
            configured: true,
            service_available: serviceAvailable,
            state: (0, whatsapp_util_1.toConnectionState)(row.status),
            status: row.status,
            phone_number: row.phone_number,
            push_name: row.push_name,
            connected_at: row.connected_at,
            last_status_at: row.last_status_at,
            last_error: row.last_error,
        };
    }
};
exports.WhatsappSessionService = WhatsappSessionService;
exports.WhatsappSessionService = WhatsappSessionService = WhatsappSessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(whatsapp_session_entity_1.WhatsappSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        waha_client_service_1.WahaClientService])
], WhatsappSessionService);
function webhookSecret() {
    const secret = (process.env.WAHA_WEBHOOK_SECRET || process.env.ENCRYPTION_KEY || '').trim();
    return secret || null;
}
//# sourceMappingURL=whatsapp-session.service.js.map