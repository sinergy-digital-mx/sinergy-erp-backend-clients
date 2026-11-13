export const WHATSAPP_MODULE_CODE = 'whatsapp';
export const WHATSAPP_ENTITY_CODE = 'whatsapp';
export const WHATSAPP_MODULE_NAME = 'WhatsApp';

export const WAHA_SESSION_STATUS = {
  STOPPED: 'STOPPED',
  STARTING: 'STARTING',
  SCAN_QR_CODE: 'SCAN_QR_CODE',
  WORKING: 'WORKING',
  FAILED: 'FAILED',
} as const;

export type WhatsappConnectionState =
  | 'not_configured'
  | 'disconnected'
  | 'starting'
  | 'waiting_qr'
  | 'connected'
  | 'failed';

export type WhatsappMessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export const WHATSAPP_MESSAGE_TYPES = ['text', 'file'] as const;
export type WhatsappMessageType = (typeof WHATSAPP_MESSAGE_TYPES)[number];

export const WAHA_WEBHOOK_EVENTS = ['session.status', 'message.ack'];

export const WAHA_WEBHOOK_PATH = '/api/webhooks/whatsapp/waha';

export const WHATSAPP_TEXT_MAX_LENGTH = 4096;
export const DEFAULT_COUNTRY_CODE = '52';
export const DEFAULT_DAILY_LIMIT = 1000;
export const DEFAULT_MIN_DELAY_MS = 2000;
export const DEFAULT_MAX_DELAY_MS = 5000;

export const WAHA_CORE_SESSION_NAME = 'default';
