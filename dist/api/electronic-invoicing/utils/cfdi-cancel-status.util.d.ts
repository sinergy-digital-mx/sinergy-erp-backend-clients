export declare function isSatCancellationInProcess(estatus?: string | null): boolean;
export declare function resolveStampStatusAfterCancelRequest(estatusUuid?: string | null, estatusCancelacion?: string | null): 'cancel_pending' | 'cancelled';
export declare function resolveStampStatusAfterSatConsult(currentStampStatus: string, satStatus: string | null | undefined, estatusCancelacion: string | null | undefined): string;
