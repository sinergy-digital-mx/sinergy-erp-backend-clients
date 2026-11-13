import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappSession } from '../../../entities/whatsapp/whatsapp-session.entity';
import {
  WAHA_CORE_SESSION_NAME,
  WAHA_SESSION_STATUS,
  WAHA_WEBHOOK_EVENTS,
  WAHA_WEBHOOK_PATH,
  WhatsappConnectionState,
} from '../whatsapp.constants';
import {
  buildSessionName,
  deriveWebhookKey,
  describeWahaPayload,
  mapWahaGroups,
  normalizeWhatsappPhone,
  phoneFromWahaId,
  supportsMultipleSessions,
  toConnectionState,
  WhatsappGroupView,
} from '../utils/whatsapp.util';
import {
  friendlyWahaMessage,
  toHttpException,
  WHATSAPP_NOT_CONNECTED_MESSAGE,
} from '../utils/whatsapp-errors';
import {
  WahaClientService,
  WahaError,
  WahaSession,
  WahaSessionConfig,
} from './waha-client.service';

export interface WhatsappSessionView {
  configured: boolean;
  service_available: boolean;
  state: WhatsappConnectionState;
  status: string | null;
  phone_number: string | null;
  push_name: string | null;
  connected_at: Date | null;
  last_status_at: Date | null;
  last_error: string | null;
}

export type WhatsappSessionMode = 'single' | 'multi';

const TIER_CACHE_MS = 5 * 60 * 1000;

@Injectable()
export class WhatsappSessionService {
  private readonly logger = new Logger(WhatsappSessionService.name);
  private modeCache: { mode: WhatsappSessionMode; expiresAt: number } | null = null;

  constructor(
    @InjectRepository(WhatsappSession)
    private readonly sessionRepo: Repository<WhatsappSession>,
    private readonly waha: WahaClientService,
  ) {}

  async getStatus(tenantId: string): Promise<WhatsappSessionView> {
    const row = await this.findByTenant(tenantId);
    if (!row) return this.emptyView();
    return this.refresh(row);
  }

  async connect(tenantId: string, userId: string): Promise<WhatsappSessionView> {
    this.assertServiceConfigured();
    try {
      const row = await this.ensureRow(tenantId, userId);
      let session = await this.fetchSession(row.session_name);
      const config = this.sessionConfig(row);
      if (!session) {
        session = await this.waha.createSession(row.session_name, config);
      } else if (
        session.status === WAHA_SESSION_STATUS.STOPPED ||
        session.status === WAHA_SESSION_STATUS.FAILED
      ) {
        await this.waha.updateSession(row.session_name, config).catch((error) => {
          this.logger.warn(`No se pudo actualizar la sesión ${row.session_name}: ${error?.status}`);
        });
        await this.waha.startSession(row.session_name);
        session = (await this.fetchSession(row.session_name)) ?? session;
      }
      row.updated_by = userId;
      await this.applySession(row, session);
      return this.toView(row, true);
    } catch (error) {
      throw toHttpException(error);
    }
  }

  async qr(tenantId: string): Promise<WhatsappSessionView & { qr_data_url: string | null }> {
    const row = await this.requireRow(tenantId);
    try {
      const session = await this.fetchSession(row.session_name);
      if (!session) {
        await this.markMissing(row);
        return { ...this.toView(row, true), qr_data_url: null };
      }
      await this.applySession(row, session);
      let qrDataUrl: string | null = null;
      if (session.status === WAHA_SESSION_STATUS.SCAN_QR_CODE) {
        const qr = await this.waha.getQr(row.session_name);
        qrDataUrl = `data:${qr.mimetype};base64,${qr.data}`;
      }
      return { ...this.toView(row, true), qr_data_url: qrDataUrl };
    } catch (error) {
      throw toHttpException(error);
    }
  }

  async pairingCode(tenantId: string, phone: string): Promise<{ code: string }> {
    const row = await this.requireRow(tenantId);
    const normalized = normalizeWhatsappPhone(phone);
    if (!normalized) throw new BadRequestException('Indica un número de teléfono válido.');
    try {
      const session = await this.fetchSession(row.session_name);
      if (!session || session.status !== WAHA_SESSION_STATUS.SCAN_QR_CODE) {
        throw new BadRequestException(
          'Primero inicia la conexión y espera a que aparezca el código QR.',
        );
      }
      const code = await this.waha.requestPairingCode(row.session_name, normalized);
      return { code };
    } catch (error) {
      throw toHttpException(error);
    }
  }

  async restart(tenantId: string, userId: string): Promise<WhatsappSessionView> {
    const row = await this.requireRow(tenantId);
    try {
      await this.waha.restartSession(row.session_name);
      const session = await this.fetchSession(row.session_name);
      row.updated_by = userId;
      if (session) await this.applySession(row, session);
      return this.toView(row, true);
    } catch (error) {
      throw toHttpException(error);
    }
  }

  async logout(tenantId: string, userId: string): Promise<WhatsappSessionView> {
    const row = await this.requireRow(tenantId);
    try {
      await this.waha.logoutSession(row.session_name).catch((error) => {
        if (!(error instanceof WahaError) || !(error.isNotFound || error.isSessionUnavailable)) {
          throw error;
        }
      });
    } catch (error) {
      throw toHttpException(error);
    }
    row.status = WAHA_SESSION_STATUS.STOPPED;
    row.phone_number = null;
    row.push_name = null;
    row.connected_at = null;
    row.last_status_at = new Date();
    row.last_error = null;
    row.updated_by = userId;
    await this.sessionRepo.save(row);
    return this.toView(row, true);
  }

  async remove(tenantId: string): Promise<void> {
    const row = await this.findByTenant(tenantId);
    if (!row) return;
    try {
      await this.waha.logoutSession(row.session_name).catch(() => undefined);
      await this.waha.deleteSession(row.session_name).catch((error) => {
        if (!(error instanceof WahaError) || !error.isNotFound) throw error;
      });
    } catch (error) {
      throw toHttpException(error);
    }
    await this.sessionRepo.remove(row);
  }

  async requireConnected(tenantId: string): Promise<WhatsappSession> {
    const row = await this.findByTenant(tenantId);
    if (!row || row.status !== WAHA_SESSION_STATUS.WORKING) {
      throw new BadRequestException(WHATSAPP_NOT_CONNECTED_MESSAGE);
    }
    return row;
  }

  async listGroups(tenantId: string): Promise<{ data: WhatsappGroupView[] }> {
    const row = await this.requireConnected(tenantId);
    try {
      let fromGroups: WhatsappGroupView[] = [];
      try {
        const raw = await this.waha.getGroups(row.session_name);
        fromGroups = mapWahaGroups(raw);
        if (!fromGroups.length) {
          this.logger.warn(
            `WAHA /groups no trajo grupos parseables (${describeWahaPayload(raw)}). Se intenta /chats.`,
          );
        }
      } catch (error) {
        this.logger.warn(
          `WAHA /groups falló (${error instanceof Error ? error.message : 'error'}). Se intenta /chats.`,
        );
      }
      if (fromGroups.length) return { data: fromGroups };
      const chats = await this.fetchChatPages(row.session_name);
      return { data: mapWahaGroups(chats) };
    } catch (error) {
      throw toHttpException(error);
    }
  }

  private async fetchChatPages(sessionName: string): Promise<unknown[]> {
    const pageSize = 200;
    const maxPages = 10;
    const rows: unknown[] = [];
    for (let page = 0; page < maxPages; page += 1) {
      const raw = await this.waha.getChats(sessionName, pageSize, page * pageSize);
      if (Array.isArray(raw)) {
        if (!raw.length) break;
        rows.push(...raw);
        if (raw.length < pageSize) break;
        continue;
      }
      rows.push(...mapWahaGroups(raw));
      break;
    }
    return rows;
  }

  findBySessionName(sessionName: string): Promise<WhatsappSession | null> {
    return this.sessionRepo.findOne({ where: { session_name: sessionName } });
  }

  async applyWebhookStatus(
    sessionName: string,
    status: string | undefined,
    me?: { id?: string; pushName?: string } | null,
  ): Promise<void> {
    if (!status) return;
    const row = await this.findBySessionName(sessionName);
    if (!row) return;
    try {
      const live = await this.fetchSession(sessionName);
      if (live) {
        await this.applySession(row, live);
        return;
      }
    } catch {
    }
    await this.applySession(row, { name: sessionName, status, me });
  }

  async markUnavailable(sessionName: string, reason: string): Promise<void> {
    await this.sessionRepo.update(
      { session_name: sessionName },
      { status: WAHA_SESSION_STATUS.STOPPED, connected_at: null, last_error: reason.slice(0, 500) },
    );
  }

  async mode(): Promise<WhatsappSessionMode> {
    const forced = (process.env.WAHA_SESSION_MODE ?? '').trim().toLowerCase();
    if (forced === 'single' || forced === 'multi') return forced;
    if (this.modeCache && this.modeCache.expiresAt > Date.now()) return this.modeCache.mode;
    const version = await this.waha.serverVersion();
    const mode: WhatsappSessionMode = supportsMultipleSessions(version) ? 'multi' : 'single';
    this.modeCache = { mode, expiresAt: Date.now() + TIER_CACHE_MS };
    return mode;
  }

  private findByTenant(tenantId: string): Promise<WhatsappSession | null> {
    return this.sessionRepo.findOne({ where: { tenant_id: tenantId } });
  }

  private async requireRow(tenantId: string): Promise<WhatsappSession> {
    const row = await this.findByTenant(tenantId);
    if (!row) throw new BadRequestException('Primero conecta WhatsApp en Configuración.');
    return row;
  }

  private async ensureRow(tenantId: string, userId: string): Promise<WhatsappSession> {
    const existing = await this.findByTenant(tenantId);
    if (existing) return existing;
    const mode = await this.mode();
    let sessionName = buildSessionName(tenantId);
    if (mode === 'single') {
      sessionName = WAHA_CORE_SESSION_NAME;
      const taken = await this.findBySessionName(sessionName);
      if (taken && taken.tenant_id !== tenantId) {
        throw new ConflictException(
          'El servicio de WhatsApp compartido ya está asignado a otra organización.',
        );
      }
    }
    try {
      return await this.sessionRepo.save(
        this.sessionRepo.create({
          tenant_id: tenantId,
          session_name: sessionName,
          status: WAHA_SESSION_STATUS.STOPPED,
          created_by: userId,
          updated_by: userId,
        }),
      );
    } catch (error) {
      const created = await this.findByTenant(tenantId);
      if (created) return created;
      throw error;
    }
  }

  private async fetchSession(name: string): Promise<WahaSession | null> {
    try {
      return await this.waha.getSession(name);
    } catch (error) {
      if (error instanceof WahaError && error.isNotFound) return null;
      throw error;
    }
  }

  private async refresh(row: WhatsappSession): Promise<WhatsappSessionView> {
    if (!this.waha.isConfigured()) return this.toView(row, false);
    try {
      const session = await this.fetchSession(row.session_name);
      if (!session) {
        await this.markMissing(row);
      } else {
        await this.applySession(row, session);
      }
      return this.toView(row, true);
    } catch (error) {
      this.logger.warn(`No se pudo sincronizar ${row.session_name}: ${friendlyWahaMessage(error)}`);
      return this.toView(row, false);
    }
  }

  private async markMissing(row: WhatsappSession): Promise<void> {
    row.status = WAHA_SESSION_STATUS.STOPPED;
    row.phone_number = null;
    row.push_name = null;
    row.connected_at = null;
    row.last_status_at = new Date();
    await this.sessionRepo.save(row);
  }

  private async applySession(row: WhatsappSession, session: WahaSession): Promise<void> {
    const previous = row.status;
    row.status = session.status;
    row.last_status_at = new Date();
    if (session.status === WAHA_SESSION_STATUS.WORKING) {
      row.phone_number = phoneFromWahaId(session.me?.id) ?? row.phone_number;
      row.push_name = session.me?.pushName ?? row.push_name;
      if (previous !== WAHA_SESSION_STATUS.WORKING || !row.connected_at) {
        row.connected_at = new Date();
      }
      row.last_error = null;
    } else {
      row.connected_at = null;
      if (session.status === WAHA_SESSION_STATUS.SCAN_QR_CODE) {
        row.phone_number = null;
        row.push_name = null;
      }
      row.last_error =
        session.status === WAHA_SESSION_STATUS.FAILED
          ? 'La sesión de WhatsApp falló. Vuelve a conectar.'
          : null;
    }
    await this.sessionRepo.save(row);
  }

  private sessionConfig(row: WhatsappSession): WahaSessionConfig {
    const config: WahaSessionConfig = {
      metadata: { 'erp.tenant_id': row.tenant_id },
    };
    const baseUrl = (process.env.WAHA_WEBHOOK_BASE_URL ?? '').trim().replace(/\/+$/, '');
    const secret = webhookSecret();
    if (baseUrl && secret) {
      config.webhooks = [
        {
          url: `${baseUrl}${WAHA_WEBHOOK_PATH}`,
          events: WAHA_WEBHOOK_EVENTS,
          hmac: { key: deriveWebhookKey(secret, row.session_name) },
          retries: { policy: 'exponential', delaySeconds: 2, attempts: 6 },
        },
      ];
    } else {
      this.logger.warn(
        'Sin WAHA_WEBHOOK_BASE_URL o secreto: no se recibirán eventos de estado ni confirmaciones.',
      );
    }
    return config;
  }

  private assertServiceConfigured(): void {
    if (!this.waha.isConfigured()) {
      throw toHttpException(new WahaError('El servicio de WhatsApp no está configurado.', 503));
    }
  }

  private emptyView(): WhatsappSessionView {
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

  private toView(row: WhatsappSession, serviceAvailable: boolean): WhatsappSessionView {
    return {
      configured: true,
      service_available: serviceAvailable,
      state: toConnectionState(row.status),
      status: row.status,
      phone_number: row.phone_number,
      push_name: row.push_name,
      connected_at: row.connected_at,
      last_status_at: row.last_status_at,
      last_error: row.last_error,
    };
  }
}

export function webhookSecret(): string | null {
  const secret = (process.env.WAHA_WEBHOOK_SECRET || process.env.ENCRYPTION_KEY || '').trim();
  return secret || null;
}
