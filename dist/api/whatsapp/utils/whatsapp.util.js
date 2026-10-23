"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSessionName = buildSessionName;
exports.normalizeWhatsappPhone = normalizeWhatsappPhone;
exports.phoneFromWahaId = phoneFromWahaId;
exports.isWhatsappGroupId = isWhatsappGroupId;
exports.normalizeWhatsappGroupId = normalizeWhatsappGroupId;
exports.mapWahaGroups = mapWahaGroups;
exports.toConnectionState = toConnectionState;
exports.ackToMessageStatus = ackToMessageStatus;
exports.shouldAdvanceStatus = shouldAdvanceStatus;
exports.extractWahaMessageId = extractWahaMessageId;
exports.deriveWebhookKey = deriveWebhookKey;
exports.verifyWebhookHmac = verifyWebhookHmac;
exports.isSafePublicHttpsUrl = isSafePublicHttpsUrl;
exports.supportsMultipleSessions = supportsMultipleSessions;
exports.randomDelay = randomDelay;
const crypto = __importStar(require("crypto"));
const whatsapp_constants_1 = require("../whatsapp.constants");
function buildSessionName(tenantId) {
    return `erp_${tenantId.replace(/[^a-zA-Z0-9]/g, '')}`;
}
function normalizeWhatsappPhone(raw, defaultCountryCode = whatsapp_constants_1.DEFAULT_COUNTRY_CODE) {
    let digits = String(raw ?? '').replace(/\D/g, '');
    if (digits.startsWith('00'))
        digits = digits.slice(2);
    if (!digits)
        return null;
    if (digits.length === 10)
        digits = `${defaultCountryCode}${digits}`;
    if (digits.startsWith('521') && digits.length === 13) {
        digits = `52${digits.slice(3)}`;
    }
    if (digits.length < 11 || digits.length > 15)
        return null;
    return digits;
}
function phoneFromWahaId(id) {
    if (!id)
        return null;
    const phone = id.split('@')[0]?.split(':')[0];
    return phone ? phone : null;
}
function isWhatsappGroupId(value) {
    return typeof value === 'string' && /@g\.us$/i.test(value.trim());
}
function normalizeWhatsappGroupId(raw) {
    const value = String(raw ?? '').trim();
    if (!value)
        return null;
    const withSuffix = value.includes('@') ? value : `${value}@g.us`;
    const at = withSuffix.lastIndexOf('@');
    const user = withSuffix.slice(0, at);
    const server = withSuffix.slice(at + 1);
    if (!user || user.length < 8 || user.length > 40)
        return null;
    if (!/^[A-Za-z0-9._-]+$/.test(user))
        return null;
    if (server.toLowerCase() !== 'g.us')
        return null;
    return `${user}@g.us`;
}
function mapWahaGroups(payload) {
    const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(asRecord(payload)?.data)
            ? asRecord(payload)?.data
            : [];
    const seen = new Set();
    const groups = [];
    for (const row of rows) {
        const id = extractGroupId(row);
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        const rec = asRecord(row);
        const name = pickTrimmed(rec?.name) ||
            pickTrimmed(rec?.subject) ||
            pickTrimmed(rec?.Name) ||
            id;
        const description = pickTrimmed(rec?.description) || pickTrimmed(rec?.desc) || null;
        groups.push({ id, name, description });
    }
    groups.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return groups;
}
function extractGroupId(row) {
    if (typeof row === 'string')
        return normalizeWhatsappGroupId(row);
    const rec = asRecord(row);
    if (!rec)
        return null;
    if (typeof rec.id === 'string')
        return normalizeWhatsappGroupId(rec.id);
    const nested = asRecord(rec.id);
    if (typeof nested?._serialized === 'string')
        return normalizeWhatsappGroupId(nested._serialized);
    if (typeof nested?.user === 'string')
        return normalizeWhatsappGroupId(String(nested.user));
    if (typeof rec.gid === 'string')
        return normalizeWhatsappGroupId(rec.gid);
    return null;
}
function pickTrimmed(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function toConnectionState(status) {
    switch (status) {
        case whatsapp_constants_1.WAHA_SESSION_STATUS.WORKING:
            return 'connected';
        case whatsapp_constants_1.WAHA_SESSION_STATUS.SCAN_QR_CODE:
            return 'waiting_qr';
        case whatsapp_constants_1.WAHA_SESSION_STATUS.STARTING:
            return 'starting';
        case whatsapp_constants_1.WAHA_SESSION_STATUS.FAILED:
            return 'failed';
        case whatsapp_constants_1.WAHA_SESSION_STATUS.STOPPED:
            return 'disconnected';
        default:
            return 'not_configured';
    }
}
function ackToMessageStatus(ack, ackName) {
    const name = String(ackName ?? '').toUpperCase();
    if (name === 'ERROR')
        return 'failed';
    if (name === 'PENDING')
        return null;
    if (name === 'SERVER')
        return 'sent';
    if (name === 'DEVICE')
        return 'delivered';
    if (name === 'READ' || name === 'PLAYED')
        return 'read';
    const value = Number(ack);
    if (!Number.isFinite(value))
        return null;
    if (value < 0)
        return 'failed';
    if (value === 1)
        return 'sent';
    if (value === 2)
        return 'delivered';
    if (value >= 3)
        return 'read';
    return null;
}
const STATUS_RANK = {
    queued: 0,
    sending: 1,
    sent: 2,
    delivered: 3,
    read: 4,
    failed: 5,
};
function shouldAdvanceStatus(current, next) {
    if (current === 'read')
        return false;
    if (next === 'failed')
        return current === 'queued' || current === 'sending' || current === 'sent';
    if (current === 'failed')
        return false;
    return STATUS_RANK[next] > STATUS_RANK[current];
}
function extractWahaMessageId(payload) {
    const record = asRecord(payload);
    if (!record)
        return null;
    const id = record.id;
    if (typeof id === 'string' && id)
        return id;
    const nested = asRecord(id);
    const serialized = nested?._serialized ?? nested?.id;
    if (typeof serialized === 'string' && serialized)
        return serialized;
    const key = asRecord(record._data)?.id;
    const keySerialized = asRecord(key)?._serialized;
    return typeof keySerialized === 'string' && keySerialized ? keySerialized : null;
}
function deriveWebhookKey(secret, sessionName) {
    return crypto.createHmac('sha256', secret).update(sessionName).digest('hex');
}
function verifyWebhookHmac(rawBody, key, receivedHmac, algorithm = 'sha512') {
    if (!receivedHmac)
        return false;
    const algo = algorithm.toLowerCase() === 'sha256' ? 'sha256' : 'sha512';
    const expected = crypto.createHmac(algo, key).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(receivedHmac.trim().toLowerCase(), 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function isSafePublicHttpsUrl(value) {
    let url;
    try {
        url = new URL(value);
    }
    catch {
        return false;
    }
    if (url.protocol !== 'https:')
        return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes('.'))
        return false;
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal'))
        return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
        return false;
    if (host.startsWith('['))
        return false;
    return true;
}
function supportsMultipleSessions(version) {
    if (String(version?.tier ?? '').toUpperCase() === 'PLUS')
        return true;
    const match = /^(\d{4})\.(\d+)/.exec(String(version?.version ?? ''));
    if (!match)
        return false;
    const year = Number(match[1]);
    const minor = Number(match[2]);
    return year > 2026 || (year === 2026 && minor >= 6);
}
function randomDelay(minMs, maxMs) {
    const min = Math.max(0, Math.min(minMs, maxMs));
    const max = Math.max(minMs, maxMs);
    return Math.floor(min + Math.random() * (max - min));
}
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    return value;
}
//# sourceMappingURL=whatsapp.util.js.map