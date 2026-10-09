"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GpsTrackingClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GpsTrackingClientService = exports.GpsProviderError = void 0;
const common_1 = require("@nestjs/common");
const gps_tracking_constants_1 = require("../gps-tracking.constants");
const gps_tracking_util_1 = require("../utils/gps-tracking.util");
class GpsProviderError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
exports.GpsProviderError = GpsProviderError;
let GpsTrackingClientService = GpsTrackingClientService_1 = class GpsTrackingClientService {
    logger = new common_1.Logger(GpsTrackingClientService_1.name);
    sessions = new Map();
    invalidate(configId) {
        this.sessions.delete(configId);
    }
    async session(configId, username, password) {
        const cached = this.sessions.get(configId);
        if (cached && cached.expiresAt > Date.now())
            return cached;
        const fresh = await this.authenticate(username, password);
        const token = {
            ...fresh,
            expiresAt: Date.now() + 20 * 60 * 60 * 1000,
        };
        this.sessions.set(configId, token);
        return token;
    }
    async authenticate(username, password) {
        const payload = await this.get('/Authentication/UserAuthenticate', {
            UserName: username,
            Password: password,
        });
        const result = asRecord(payload.Result);
        const userIdGuid = text(result?.UserIdGuid);
        const sessionId = text(result?.SessionId);
        if (!userIdGuid || !sessionId) {
            throw this.toError(payload);
        }
        return { userIdGuid, sessionId };
    }
    async latestPositions(token, since = daysAgo(14)) {
        const payload = await this.get('/Units/LatestPositionsList', {
            UserIdGuid: token.userIdGuid,
            SessionId: token.sessionId,
            LastDateReceivedUtc: (0, gps_tracking_util_1.formatTrackingSince)(since),
        });
        return this.readUnits(payload);
    }
    async listUnits(token) {
        const payload = await this.get('/Units/Unit/List', {
            UserIdGuid: token.userIdGuid,
            SessionId: token.sessionId,
        });
        const rows = Array.isArray(payload.Result) ? payload.Result : [];
        return rows
            .map((row) => {
            const record = asRecord(row);
            const uid = text(record?.Uid);
            const name = text(record?.Name) || uid;
            if (!uid || !name)
                return null;
            return {
                uid,
                name,
                imei: text(record?.IMEI) || text(record?.Imei),
            };
        })
            .filter((row) => !!row);
    }
    readUnits(payload) {
        const status = asRecord(payload.Status);
        if (isErrorStatus(status))
            throw this.toError(payload);
        const rows = Array.isArray(payload.Result) ? payload.Result : [];
        return rows
            .map((row) => (0, gps_tracking_util_1.normalizeGpsUnit)(row))
            .filter((row) => !!row);
    }
    async get(path, params) {
        const url = new URL(`${gps_tracking_constants_1.GPS_TRACKING_BASE_URL}${path}`);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        let response;
        try {
            response = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (error) {
            this.logger.warn(`3D Tracking no respondió en ${path}`);
            throw new GpsProviderError('3D Tracking no respondió. Intenta de nuevo.');
        }
        const payload = (await response.json().catch(() => null));
        if (!payload || typeof payload !== 'object') {
            throw new GpsProviderError('3D Tracking devolvió una respuesta inválida.');
        }
        const status = asRecord(payload.Status);
        if (!response.ok || isErrorStatus(status)) {
            throw this.toError(payload);
        }
        return payload;
    }
    toError(payload) {
        const status = asRecord(payload.Status);
        const code = text(status?.ErrorCode) || undefined;
        const providerMessage = text(status?.Message) || undefined;
        return new GpsProviderError((0, gps_tracking_util_1.translateGpsProviderError)(code, providerMessage), code);
    }
};
exports.GpsTrackingClientService = GpsTrackingClientService;
exports.GpsTrackingClientService = GpsTrackingClientService = GpsTrackingClientService_1 = __decorate([
    (0, common_1.Injectable)()
], GpsTrackingClientService);
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    return value;
}
function text(value) {
    if (value === null || value === undefined)
        return null;
    const raw = String(value).trim();
    return raw ? raw : null;
}
function isErrorStatus(status) {
    if (!status)
        return false;
    const result = String(status.Result ?? '').toLowerCase();
    if (result === 'error')
        return true;
    const code = text(status.ErrorCode);
    return !!code && code !== '0';
}
function daysAgo(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
//# sourceMappingURL=gps-tracking-client.service.js.map