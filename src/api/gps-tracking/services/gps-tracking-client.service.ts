import { Injectable, Logger } from '@nestjs/common';
import { GPS_TRACKING_BASE_URL } from '../gps-tracking.constants';
import {
  formatTrackingSince,
  normalizeGpsUnit,
  NormalizedGpsUnit,
  translateGpsProviderError,
} from '../utils/gps-tracking.util';

export class GpsProviderError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

interface SessionToken {
  userIdGuid: string;
  sessionId: string;
  expiresAt: number;
}

interface ProviderPayload {
  Status?: unknown;
  Result?: unknown;
}

@Injectable()
export class GpsTrackingClientService {
  private readonly logger = new Logger(GpsTrackingClientService.name);
  private readonly sessions = new Map<string, SessionToken>();

  invalidate(configId: string): void {
    this.sessions.delete(configId);
  }

  async session(configId: string, username: string, password: string): Promise<SessionToken> {
    const cached = this.sessions.get(configId);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const fresh = await this.authenticate(username, password);
    const token: SessionToken = {
      ...fresh,
      expiresAt: Date.now() + 20 * 60 * 60 * 1000,
    };
    this.sessions.set(configId, token);
    return token;
  }

  async authenticate(
    username: string,
    password: string,
  ): Promise<{ userIdGuid: string; sessionId: string }> {
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

  async latestPositions(
    token: Pick<SessionToken, 'userIdGuid' | 'sessionId'>,
    since: Date = daysAgo(14),
  ): Promise<NormalizedGpsUnit[]> {
    const payload = await this.get('/Units/LatestPositionsList', {
      UserIdGuid: token.userIdGuid,
      SessionId: token.sessionId,
      LastDateReceivedUtc: formatTrackingSince(since),
    });
    return this.readUnits(payload);
  }

  async listUnits(
    token: Pick<SessionToken, 'userIdGuid' | 'sessionId'>,
  ): Promise<Array<{ uid: string; name: string; imei: string | null }>> {
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
        if (!uid || !name) return null;
        return {
          uid,
          name,
          imei: text(record?.IMEI) || text(record?.Imei),
        };
      })
      .filter((row): row is { uid: string; name: string; imei: string | null } => !!row);
  }

  private readUnits(payload: ProviderPayload): NormalizedGpsUnit[] {
    const status = asRecord(payload.Status);
    if (isErrorStatus(status)) throw this.toError(payload);
    const rows = Array.isArray(payload.Result) ? payload.Result : [];
    return rows
      .map((row) => normalizeGpsUnit(row))
      .filter((row): row is NormalizedGpsUnit => !!row);
  }

  private async get(path: string, params: Record<string, string>): Promise<ProviderPayload> {
    const url = new URL(`${GPS_TRACKING_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
      });
    } catch (error) {
      this.logger.warn(`3D Tracking no respondió en ${path}`);
      throw new GpsProviderError('3D Tracking no respondió. Intenta de nuevo.');
    }

    const payload = (await response.json().catch(() => null)) as ProviderPayload | null;
    if (!payload || typeof payload !== 'object') {
      throw new GpsProviderError('3D Tracking devolvió una respuesta inválida.');
    }
    const status = asRecord(payload.Status);
    if (!response.ok || isErrorStatus(status)) {
      throw this.toError(payload);
    }
    return payload;
  }

  private toError(payload: ProviderPayload): GpsProviderError {
    const status = asRecord(payload.Status);
    const code = text(status?.ErrorCode) || undefined;
    const providerMessage = text(status?.Message) || undefined;
    return new GpsProviderError(translateGpsProviderError(code, providerMessage), code);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  return raw ? raw : null;
}

function isErrorStatus(status: Record<string, unknown> | null): boolean {
  if (!status) return false;
  const result = String(status.Result ?? '').toLowerCase();
  if (result === 'error') return true;
  const code = text(status.ErrorCode);
  return !!code && code !== '0';
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
