import { Observable } from 'rxjs';
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
export declare class PosCajaRecallHub {
    private readonly events$;
    private readonly recent;
    publish(event: Omit<PosCajaRecallEvent, 'at' | 'type'> & {
        at?: string;
    }): PosCajaRecallEvent;
    publishArrived(event: Omit<PosCajaRecallEvent, 'at' | 'type' | 'recalledByName'> & {
        at?: string;
    }): PosCajaRecallEvent;
    find(tenantId: string, kind: PosCajaRecallKind, id: string): PosCajaRecallEvent | null;
    messageFor(tenantId: string, kind: PosCajaRecallKind, id: string, folio?: string | null): string;
    stream(tenantId: string, branchId?: string | null): Observable<PosCajaRecallEvent>;
    private sameBranch;
    private build;
    private key;
    private prune;
}
