import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { cajaRecallMessage } from './utils/pos-caja-recall.util';

export type PosCajaRecallKind = 'sale' | 'advance';

export type PosCajaLiveType = 'arrived' | 'recalled';

export interface PosCajaRecallEvent {
  type: PosCajaLiveType;
  tenantId: string;
  branchId: string | null;
  id: string;
  kind: PosCajaRecallKind;
  folio: string;
  recalledByName: string;
  at: string;
}

const NOTICE_TTL_MS = 2 * 60 * 1000;

@Injectable()
export class PosCajaRecallHub {
  private readonly events$ = new Subject<PosCajaRecallEvent>();
  private readonly recent = new Map<string, PosCajaRecallEvent>();

  publish(event: Omit<PosCajaRecallEvent, 'at' | 'type'> & { at?: string }): PosCajaRecallEvent {
    const full = this.build(event, 'recalled');
    this.recent.set(this.key(full.tenantId, full.kind, full.id), full);
    this.prune();
    this.events$.next(full);
    return full;
  }

  /** Venta o anticipo que acaba de entrar a la cola de cobro. */
  publishArrived(
    event: Omit<PosCajaRecallEvent, 'at' | 'type' | 'recalledByName'> & { at?: string },
  ): PosCajaRecallEvent {
    const full = this.build({ ...event, recalledByName: '' }, 'arrived');
    this.events$.next(full);
    return full;
  }

  find(tenantId: string, kind: PosCajaRecallKind, id: string): PosCajaRecallEvent | null {
    this.prune();
    return this.recent.get(this.key(tenantId, kind, id)) ?? null;
  }

  messageFor(
    tenantId: string,
    kind: PosCajaRecallKind,
    id: string,
    folio?: string | null,
  ): string {
    const notice = this.find(tenantId, kind, id);
    return cajaRecallMessage(notice?.recalledByName, notice?.folio || folio);
  }

  stream(tenantId: string, branchId?: string | null): Observable<PosCajaRecallEvent> {
    return this.events$.pipe(
      filter((event) => event.tenantId === tenantId && this.sameBranch(event.branchId, branchId)),
    );
  }

  private sameBranch(eventBranchId: string | null, listenerBranchId?: string | null): boolean {
    if (!eventBranchId || !listenerBranchId) {
      return true;
    }
    return eventBranchId === listenerBranchId;
  }

  private build(
    event: Omit<PosCajaRecallEvent, 'at' | 'type'> & { at?: string },
    type: PosCajaLiveType,
  ): PosCajaRecallEvent {
    return {
      ...event,
      type,
      branchId: event.branchId || null,
      folio: (event.folio || '').trim() || event.id,
      recalledByName: (event.recalledByName || '').trim(),
      at: event.at ?? new Date().toISOString(),
    };
  }

  private key(tenantId: string, kind: PosCajaRecallKind, id: string): string {
    return `${tenantId}:${kind}:${id}`;
  }

  private prune(): void {
    const cutoff = Date.now() - NOTICE_TTL_MS;
    for (const [key, event] of this.recent) {
      if (new Date(event.at).getTime() < cutoff) {
        this.recent.delete(key);
      }
    }
  }
}
