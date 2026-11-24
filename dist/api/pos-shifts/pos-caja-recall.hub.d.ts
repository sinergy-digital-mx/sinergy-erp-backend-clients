import { Observable } from 'rxjs';
export type PosCajaRecallKind = 'sale' | 'advance';
export interface PosCajaRecallEvent {
    tenantId: string;
    branchId: string | null;
    id: string;
    kind: PosCajaRecallKind;
    folio: string;
    recalledByName: string;
    at: string;
}
export declare class PosCajaRecallHub {
    private readonly events$;
    private readonly recent;
    publish(event: Omit<PosCajaRecallEvent, 'at'> & {
        at?: string;
    }): PosCajaRecallEvent;
    find(tenantId: string, kind: PosCajaRecallKind, id: string): PosCajaRecallEvent | null;
    messageFor(tenantId: string, kind: PosCajaRecallKind, id: string, folio?: string | null): string;
    stream(tenantId: string, branchId?: string | null): Observable<PosCajaRecallEvent>;
    private sameBranch;
    private key;
    private prune;
}
