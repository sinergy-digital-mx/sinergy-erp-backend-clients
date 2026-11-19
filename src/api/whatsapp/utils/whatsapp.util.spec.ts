import * as crypto from 'crypto';
import {
  ackToMessageStatus,
  buildSessionName,
  deriveWebhookKey,
  extractWahaMessageId,
  isSafePublicHttpsUrl,
  isWhatsappGroupId,
  mapWahaGroups,
  normalizeWhatsappGroupId,
  normalizeWhatsappPhone,
  phoneFromWahaId,
  shouldAdvanceStatus,
  supportsMultipleSessions,
  toConnectionState,
  verifyWebhookHmac,
} from './whatsapp.util';

describe('whatsapp.util', () => {
  it('genera un nombre de sesión válido y distinto por organización', () => {
    const a = buildSessionName('afff1757-dbcf-4715-a756-6b22bb2c59d5');
    const b = buildSessionName('11111111-dbcf-4715-a756-6b22bb2c59d5');
    expect(a).toBe('erp_afff1757dbcf4715a7566b22bb2c59d5');
    expect(a).toMatch(/^[A-Za-z0-9_]+$/);
    expect(a).not.toBe(b);
  });

  describe('normalizeWhatsappPhone', () => {
    it('agrega 52 a 10 dígitos', () => {
      expect(normalizeWhatsappPhone('(55) 1234-5678')).toBe('525512345678');
    });
    it('convierte 521 + 10 dígitos al formato actual', () => {
      expect(normalizeWhatsappPhone('+52 1 55 1234 5678')).toBe('525512345678');
    });
    it('respeta otros países', () => {
      expect(normalizeWhatsappPhone('+1 415 555 2671')).toBe('14155552671');
    });
    it('rechaza números inválidos', () => {
      expect(normalizeWhatsappPhone('123')).toBeNull();
      expect(normalizeWhatsappPhone('')).toBeNull();
      expect(normalizeWhatsappPhone('1234567890123456')).toBeNull();
    });
  });

  it('extrae el teléfono del id de WAHA', () => {
    expect(phoneFromWahaId('525512345678@c.us')).toBe('525512345678');
    expect(phoneFromWahaId('525512345678:12@c.us')).toBe('525512345678');
    expect(phoneFromWahaId(undefined)).toBeNull();
  });

  describe('grupos de WhatsApp', () => {
    it('normaliza el group id', () => {
      expect(normalizeWhatsappGroupId('120363025246125738@g.us')).toBe('120363025246125738@g.us');
      expect(normalizeWhatsappGroupId('120363025246125738')).toBe('120363025246125738@g.us');
      expect(normalizeWhatsappGroupId('525512345678@c.us')).toBeNull();
      expect(normalizeWhatsappGroupId('abc')).toBeNull();
      expect(isWhatsappGroupId('120363025246125738@g.us')).toBe(true);
      expect(isWhatsappGroupId('525512345678@c.us')).toBe(false);
    });

    it('mapea la respuesta de WAHA (WEBJS y NOWEB)', () => {
      expect(
        mapWahaGroups([
          { id: '120363025246125738@g.us', name: 'Cobranza', description: 'Pagos' },
          {
            id: { _serialized: '120363111111111111@g.us', user: '120363111111111111', server: 'g.us' },
            subject: 'Operación',
          },
          { id: '525512345678@c.us', name: 'no es grupo' },
        ]),
      ).toEqual([
        { id: '120363025246125738@g.us', name: 'Cobranza', description: 'Pagos' },
        { id: '120363111111111111@g.us', name: 'Operación', description: null },
      ]);
    });

    it('mapea el mapa de NOWEB keyed por group id', () => {
      expect(
        mapWahaGroups({
          '120363025246125738@g.us': {
            id: '120363025246125738@g.us',
            subject: 'Cobranza',
            desc: 'Pagos',
          },
          '120363111111111111@g.us': {
            id: '120363111111111111@g.us',
            subject: 'Operación',
          },
        }),
      ).toEqual([
        { id: '120363025246125738@g.us', name: 'Cobranza', description: 'Pagos' },
        { id: '120363111111111111@g.us', name: 'Operación', description: null },
      ]);
    });

    it('filtra grupos dentro de /chats', () => {
      expect(
        mapWahaGroups([
          { id: '525512345678@c.us', name: 'Juan' },
          { id: '120363025246125738@g.us', name: 'Cobranza' },
        ]),
      ).toEqual([{ id: '120363025246125738@g.us', name: 'Cobranza', description: null }]);
    });
  });

  it('traduce el estado de WAHA', () => {
    expect(toConnectionState('WORKING')).toBe('connected');
    expect(toConnectionState('SCAN_QR_CODE')).toBe('waiting_qr');
    expect(toConnectionState('STARTING')).toBe('starting');
    expect(toConnectionState('FAILED')).toBe('failed');
    expect(toConnectionState('STOPPED')).toBe('disconnected');
    expect(toConnectionState(null)).toBe('not_configured');
  });

  it('traduce acks', () => {
    expect(ackToMessageStatus(1)).toBe('sent');
    expect(ackToMessageStatus(2)).toBe('delivered');
    expect(ackToMessageStatus(3)).toBe('read');
    expect(ackToMessageStatus(4)).toBe('read');
    expect(ackToMessageStatus(-1)).toBe('failed');
    expect(ackToMessageStatus(0)).toBeNull();
    expect(ackToMessageStatus(undefined, 'DEVICE')).toBe('delivered');
  });

  it('un ack tardío no regresa el estado', () => {
    expect(shouldAdvanceStatus('delivered', 'sent')).toBe(false);
    expect(shouldAdvanceStatus('sent', 'delivered')).toBe(true);
    expect(shouldAdvanceStatus('read', 'delivered')).toBe(false);
    expect(shouldAdvanceStatus('sending', 'failed')).toBe(true);
    expect(shouldAdvanceStatus('delivered', 'failed')).toBe(false);
  });

  it('extrae el id del mensaje de ambos motores', () => {
    expect(extractWahaMessageId({ id: 'true_5255@c.us_ABC' })).toBe('true_5255@c.us_ABC');
    expect(extractWahaMessageId({ id: { _serialized: 'true_5255@c.us_XYZ' } })).toBe(
      'true_5255@c.us_XYZ',
    );
    expect(extractWahaMessageId(null)).toBeNull();
  });

  describe('webhook HMAC', () => {
    const body = JSON.stringify({ event: 'message.ack', session: 'erp_abc' });
    const key = deriveWebhookKey('secreto', 'erp_abc');
    const signature = crypto.createHmac('sha512', key).update(body).digest('hex');

    it('la llave es distinta por sesión', () => {
      expect(deriveWebhookKey('secreto', 'erp_abc')).not.toBe(deriveWebhookKey('secreto', 'erp_xyz'));
    });
    it('acepta una firma correcta', () => {
      expect(verifyWebhookHmac(body, key, signature, 'sha512')).toBe(true);
    });
    it('rechaza firma incorrecta, ausente o de otra sesión', () => {
      expect(verifyWebhookHmac(body, key, 'abc', 'sha512')).toBe(false);
      expect(verifyWebhookHmac(body, key, undefined)).toBe(false);
      const other = deriveWebhookKey('secreto', 'erp_xyz');
      expect(verifyWebhookHmac(body, other, signature, 'sha512')).toBe(false);
    });
  });

  it('detecta varias sesiones por versión (Plus ahora vive en Core)', () => {
    expect(supportsMultipleSessions({ version: '2026.9.2', tier: 'CORE' })).toBe(true);
    expect(supportsMultipleSessions({ version: '2026.6.1', tier: 'CORE' })).toBe(true);
    expect(supportsMultipleSessions({ version: '2027.1.0', tier: 'CORE' })).toBe(true);
    expect(supportsMultipleSessions({ version: '2026.5.3', tier: 'CORE' })).toBe(false);
    expect(supportsMultipleSessions({ version: '2026.5.3', tier: 'PLUS' })).toBe(true);
    expect(supportsMultipleSessions({ tier: 'CORE' })).toBe(false);
    expect(supportsMultipleSessions(null)).toBe(false);
  });

  it('solo permite URLs https públicas', () => {
    expect(isSafePublicHttpsUrl('https://cdn.ejemplo.com/a.pdf')).toBe(true);
    expect(isSafePublicHttpsUrl('http://cdn.ejemplo.com/a.pdf')).toBe(false);
    expect(isSafePublicHttpsUrl('https://localhost/a.pdf')).toBe(false);
    expect(isSafePublicHttpsUrl('https://10.0.0.5/a.pdf')).toBe(false);
    expect(isSafePublicHttpsUrl('https://waha.railway.internal/a')).toBe(false);
    expect(isSafePublicHttpsUrl('no-url')).toBe(false);
  });
});
