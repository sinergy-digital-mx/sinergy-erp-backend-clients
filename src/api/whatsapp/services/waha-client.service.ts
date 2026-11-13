import { Injectable, Logger } from '@nestjs/common';

export class WahaError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isSessionUnavailable(): boolean {
    return this.status === 422 || this.status === 409;
  }
}

export interface WahaSession {
  name: string;
  status: string;
  me?: { id?: string; pushName?: string } | null;
  config?: Record<string, unknown> | null;
}

export interface WahaServerVersion {
  version?: string;
  engine?: string;
  tier?: string;
}

export interface WahaFilePayload {
  url?: string;
  data?: string;
  filename?: string;
  mimetype?: string;
}

export interface WahaSessionConfig {
  webhooks?: Array<Record<string, unknown>>;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

@Injectable()
export class WahaClientService {
  private readonly logger = new Logger(WahaClientService.name);

  isConfigured(): boolean {
    return !!this.baseUrl() && !!process.env.WAHA_API_KEY?.trim();
  }

  serverVersion(): Promise<WahaServerVersion> {
    return this.request<WahaServerVersion>('GET', '/api/server/version');
  }

  getSession(name: string): Promise<WahaSession> {
    return this.request<WahaSession>('GET', `/api/sessions/${encodeURIComponent(name)}`);
  }

  createSession(name: string, config: WahaSessionConfig): Promise<WahaSession> {
    return this.request<WahaSession>('POST', '/api/sessions', { name, start: true, config });
  }

  updateSession(name: string, config: WahaSessionConfig): Promise<WahaSession> {
    return this.request<WahaSession>('PUT', `/api/sessions/${encodeURIComponent(name)}`, {
      name,
      config,
    });
  }

  async startSession(name: string): Promise<void> {
    await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/start`);
  }

  async stopSession(name: string): Promise<void> {
    await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/stop`);
  }

  async restartSession(name: string): Promise<void> {
    await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/restart`);
  }

  async logoutSession(name: string): Promise<void> {
    await this.request('POST', `/api/sessions/${encodeURIComponent(name)}/logout`);
  }

  async deleteSession(name: string): Promise<void> {
    await this.request('DELETE', `/api/sessions/${encodeURIComponent(name)}`);
  }

  async getQr(name: string): Promise<{ mimetype: string; data: string }> {
    const response = await this.raw(
      'GET',
      `/api/${encodeURIComponent(name)}/auth/qr?format=image`,
      undefined,
      { Accept: 'application/json' },
    );
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.startsWith('image/')) {
      const buffer = Buffer.from(await response.arrayBuffer());
      return { mimetype: contentType.split(';')[0], data: buffer.toString('base64') };
    }
    const json = (await response.json().catch(() => null)) as {
      mimetype?: string;
      data?: string;
    } | null;
    if (!json?.data) throw new WahaError('Respuesta de QR inválida.', 502);
    return { mimetype: json.mimetype || 'image/png', data: json.data };
  }

  async requestPairingCode(name: string, phoneNumber: string): Promise<string> {
    const result = await this.request<{ code?: string }>(
      'POST',
      `/api/${encodeURIComponent(name)}/auth/request-code`,
      { phoneNumber },
    );
    if (!result?.code) throw new WahaError('WAHA no devolvió el código.', 502);
    return result.code;
  }

  checkNumberExists(
    session: string,
    phone: string,
  ): Promise<{ numberExists: boolean; chatId?: string | null }> {
    const query = new URLSearchParams({ phone, session });
    return this.request('GET', `/api/contacts/check-exists?${query.toString()}`);
  }

  getGroups(session: string): Promise<unknown> {
    const query = new URLSearchParams({ exclude: 'participants' });
    return this.request('GET', `/api/${encodeURIComponent(session)}/groups?${query.toString()}`);
  }

  getChats(session: string, limit = 200, offset = 0): Promise<unknown> {
    const query = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return this.request('GET', `/api/${encodeURIComponent(session)}/chats?${query.toString()}`);
  }

  async startTyping(session: string, chatId: string): Promise<void> {
    await this.request('POST', '/api/startTyping', { session, chatId });
  }

  async stopTyping(session: string, chatId: string): Promise<void> {
    await this.request('POST', '/api/stopTyping', { session, chatId });
  }

  sendText(session: string, chatId: string, text: string): Promise<unknown> {
    return this.request('POST', '/api/sendText', { session, chatId, text });
  }

  sendFile(
    session: string,
    chatId: string,
    file: WahaFilePayload,
    caption?: string,
  ): Promise<unknown> {
    return this.request('POST', '/api/sendFile', {
      session,
      chatId,
      file,
      ...(caption ? { caption } : {}),
    });
  }

  sendImage(
    session: string,
    chatId: string,
    file: WahaFilePayload,
    caption?: string,
  ): Promise<unknown> {
    return this.request('POST', '/api/sendImage', {
      session,
      chatId,
      file,
      ...(caption ? { caption } : {}),
    });
  }

  private baseUrl(): string {
    return (process.env.WAHA_BASE_URL ?? '').trim().replace(/\/+$/, '');
  }

  private async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.raw(method, path, body);
    const text = await response.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  private async raw(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<Response> {
    if (!this.isConfigured()) {
      throw new WahaError('El servicio de WhatsApp no está configurado.', 503);
    }
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl()}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          'X-Api-Key': process.env.WAHA_API_KEY!.trim(),
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...extraHeaders,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      this.logger.warn(`WAHA no respondió: ${method} ${path.split('?')[0]}`);
      throw new WahaError('El servicio de WhatsApp no respondió. Intenta de nuevo.', 503);
    }
    if (response.ok) return response;
    const detail = await response.text().catch(() => '');
    this.logger.warn(
      `WAHA ${response.status} en ${method} ${path.split('?')[0]}: ${detail.slice(0, 300)}`,
    );
    throw new WahaError(`WAHA respondió ${response.status}`, response.status, detail.slice(0, 500));
  }
}
