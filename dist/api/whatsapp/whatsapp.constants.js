"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAHA_CORE_SESSION_NAME = exports.DEFAULT_MAX_DELAY_MS = exports.DEFAULT_MIN_DELAY_MS = exports.DEFAULT_DAILY_LIMIT = exports.DEFAULT_COUNTRY_CODE = exports.WHATSAPP_TEXT_MAX_LENGTH = exports.WAHA_WEBHOOK_PATH = exports.WAHA_WEBHOOK_EVENTS = exports.WHATSAPP_MESSAGE_TYPES = exports.WAHA_SESSION_STATUS = exports.WHATSAPP_MODULE_NAME = exports.WHATSAPP_ENTITY_CODE = exports.WHATSAPP_MODULE_CODE = void 0;
exports.WHATSAPP_MODULE_CODE = 'whatsapp';
exports.WHATSAPP_ENTITY_CODE = 'whatsapp';
exports.WHATSAPP_MODULE_NAME = 'WhatsApp';
exports.WAHA_SESSION_STATUS = {
    STOPPED: 'STOPPED',
    STARTING: 'STARTING',
    SCAN_QR_CODE: 'SCAN_QR_CODE',
    WORKING: 'WORKING',
    FAILED: 'FAILED',
};
exports.WHATSAPP_MESSAGE_TYPES = ['text', 'file'];
exports.WAHA_WEBHOOK_EVENTS = ['session.status', 'message.ack'];
exports.WAHA_WEBHOOK_PATH = '/api/webhooks/whatsapp/waha';
exports.WHATSAPP_TEXT_MAX_LENGTH = 4096;
exports.DEFAULT_COUNTRY_CODE = '52';
exports.DEFAULT_DAILY_LIMIT = 1000;
exports.DEFAULT_MIN_DELAY_MS = 2000;
exports.DEFAULT_MAX_DELAY_MS = 5000;
exports.WAHA_CORE_SESSION_NAME = 'default';
//# sourceMappingURL=whatsapp.constants.js.map