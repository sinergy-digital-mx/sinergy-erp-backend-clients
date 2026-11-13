import * as crypto from 'crypto';
import {
  DEFAULT_COUNTRY_CODE,
  WAHA_SESSION_STATUS,
  WhatsappConnectionState,
  WhatsappMessageStatus,
} from '../whatsapp.constants';

export function buildSessionName(tenantId: string): string {
  return `erp_${tenantId.replace(/[^a-zA-Z0-9]/g, '')}`;
}

export function normalizeWhatsappPhone(
  raw: string,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!digits) return null;
  if (digits.length === 10) digits = `${defaultCountryCode}${digits}`;
  if (digits.startsWith('521') && digits.length === 13) {
    digits = `52${digits.slice(3)}`;
  }
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

export function phoneFromWahaId(id?: string | null): string | null {
  if (!id) return null;
  const phone = id.split('@')[0]?.split(':')[0];
  return phone ? phone : null;
}

export function isWhatsappGroupId(value?: string | null): boolean {
  return typeof value === 'string' && /@g\.us$/i.test(value.trim());
}

export function normalizeWhatsappGroupId(raw: string): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const withSuffix = value.includes('@') ? value : `${value}@g.us`;
  const at = withSuffix.lastIndexOf('@');
  const user = withSuffix.slice(0, at);
  const server = withSuffix.slice(at + 1);
  if (!user || user.length < 8 || user.length > 40) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(user)) return null;
  if (server.toLowerCase() !== 'g.us') return null;
  return `${user}@g.us`;
}

export interface WhatsappGroupView {
  id: string;
  name: string;
  description: string | null;
}

export function mapWahaGroups(payload: unknown): WhatsappGroupView[] {
  const seen = new Set<string>();
  const groups: WhatsappGroupView[] = [];
  for (const row of wahaCollectionRows(payload)) {
    const id = extractGroupId(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const rec = asRecord(row);
    const name =
      pickTrimmed(rec?.name) ||
      pickTrimmed(rec?.subject) ||
      pickTrimmed(rec?.Name) ||
      id;
    const description = pickTrimmed(rec?.description) || pickTrimmed(rec?.desc) || null;
    groups.push({ id, name, description });
  }
  groups.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return groups;
}

export function describeWahaPayload(payload: unknown): string {
  if (payload == null) return 'null';
  if (Array.isArray(payload)) return `array(${payload.length})`;
  const rec = asRecord(payload);
  if (!rec) return typeof payload;
  const keys = Object.keys(rec);
  return `object(keys=${keys.length}, sample=${keys.slice(0, 3).join(',')})`;
}

function wahaCollectionRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const rec = asRecord(payload);
  if (!rec) return [];
  for (const key of ['data', 'groups', 'chats']) {
    const nested = rec[key];
    if (Array.isArray(nested)) return nested;
    const nestedRec = asRecord(nested);
    if (nestedRec && looksLikeGroupMap(nestedRec)) return rowsFromGroupMap(nestedRec);
  }
  if (looksLikeGroupMap(rec)) return rowsFromGroupMap(rec);
  if (extractGroupId(rec)) return [rec];
  return [];
}

function looksLikeGroupMap(rec: Record<string, unknown>): boolean {
  return Object.keys(rec).some(
    (key) =>
      isWhatsappGroupId(key) ||
      !!extractGroupId(rec[key]) ||
      isWhatsappGroupId(String(asRecord(rec[key])?.id ?? '')),
  );
}

function rowsFromGroupMap(rec: Record<string, unknown>): Record<string, unknown>[] {
  return Object.entries(rec).map(([key, value]) => {
    const nested = asRecord(value);
    if (nested) return nested.id ? nested : { ...nested, id: key };
    return { id: key };
  });
}

function extractGroupId(row: unknown): string | null {
  if (typeof row === 'string') return idIfGroup(row);
  const rec = asRecord(row);
  if (!rec) return null;
  for (const key of ['id', 'jid', 'JID', 'gid', 'chatId', 'chat_id']) {
    const value = rec[key];
    if (typeof value === 'string') {
      const id = idIfGroup(value);
      if (id) return id;
    }
    const nested = asRecord(value);
    if (typeof nested?._serialized === 'string') {
      const id = idIfGroup(nested._serialized);
      if (id) return id;
    }
    if (typeof nested?.user === 'string' && String(nested.server ?? '') === 'g.us') {
      const id = normalizeWhatsappGroupId(String(nested.user));
      if (id) return id;
    }
  }
  return null;
}

function idIfGroup(value: string): string | null {
  return value.includes('@') ? normalizeWhatsappGroupId(value) : null;
}

function pickTrimmed(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function toConnectionState(status?: string | null): WhatsappConnectionState {
  switch (status) {
    case WAHA_SESSION_STATUS.WORKING:
      return 'connected';
    case WAHA_SESSION_STATUS.SCAN_QR_CODE:
      return 'waiting_qr';
    case WAHA_SESSION_STATUS.STARTING:
      return 'starting';
    case WAHA_SESSION_STATUS.FAILED:
      return 'failed';
    case WAHA_SESSION_STATUS.STOPPED:
      return 'disconnected';
    default:
      return 'not_configured';
  }
}

export function ackToMessageStatus(
  ack: number | string | null | undefined,
  ackName?: string | null,
): WhatsappMessageStatus | null {
  const name = String(ackName ?? '').toUpperCase();
  if (name === 'ERROR') return 'failed';
  if (name === 'PENDING') return null;
  if (name === 'SERVER') return 'sent';
  if (name === 'DEVICE') return 'delivered';
  if (name === 'READ' || name === 'PLAYED') return 'read';
  const value = Number(ack);
  if (!Number.isFinite(value)) return null;
  if (value < 0) return 'failed';
  if (value === 1) return 'sent';
  if (value === 2) return 'delivered';
  if (value >= 3) return 'read';
  return null;
}

const STATUS_RANK: Record<WhatsappMessageStatus, number> = {
  queued: 0,
  sending: 1,
  sent: 2,
  delivered: 3,
  read: 4,
  failed: 5,
};

export function shouldAdvanceStatus(
  current: WhatsappMessageStatus,
  next: WhatsappMessageStatus,
): boolean {
  if (current === 'read') return false;
  if (next === 'failed') return current === 'queued' || current === 'sending' || current === 'sent';
  if (current === 'failed') return false;
  return STATUS_RANK[next] > STATUS_RANK[current];
}

export function extractWahaMessageId(payload: unknown): string | null {
  const record = asRecord(payload);
  if (!record) return null;
  const id = record.id;
  if (typeof id === 'string' && id) return id;
  const nested = asRecord(id);
  const serialized = nested?._serialized ?? nested?.id;
  if (typeof serialized === 'string' && serialized) return serialized;
  const key = asRecord(record._data)?.id;
  const keySerialized = asRecord(key)?._serialized;
  return typeof keySerialized === 'string' && keySerialized ? keySerialized : null;
}

export function deriveWebhookKey(secret: string, sessionName: string): string {
  return crypto.createHmac('sha256', secret).update(sessionName).digest('hex');
}

export function verifyWebhookHmac(
  rawBody: Buffer | string,
  key: string,
  receivedHmac: string | undefined,
  algorithm = 'sha512',
): boolean {
  if (!receivedHmac) return false;
  const algo = algorithm.toLowerCase() === 'sha256' ? 'sha256' : 'sha512';
  const expected = crypto.createHmac(algo, key).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(receivedHmac.trim().toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isSafePublicHttpsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes('.')) return false;
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.startsWith('[')) return false;
  return true;
}

export function supportsMultipleSessions(
  version?: { version?: string; tier?: string } | null,
): boolean {
  if (String(version?.tier ?? '').toUpperCase() === 'PLUS') return true;
  const match = /^(\d{4})\.(\d+)/.exec(String(version?.version ?? ''));
  if (!match) return false;
  const year = Number(match[1]);
  const minor = Number(match[2]);
  return year > 2026 || (year === 2026 && minor >= 6);
}

export function randomDelay(minMs: number, maxMs: number): number {
  const min = Math.max(0, Math.min(minMs, maxMs));
  const max = Math.max(minMs, maxMs);
  return Math.floor(min + Math.random() * (max - min));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
