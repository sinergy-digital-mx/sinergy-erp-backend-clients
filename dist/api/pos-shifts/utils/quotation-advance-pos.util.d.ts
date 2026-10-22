export declare function isQuotationAdvanceInCaja(posStage: string | null | undefined, advanceRequestedTotal?: number | null): boolean;
export declare function getQuotationReturnToSalesBlockedReason(input: {
    generalStatus?: string | null;
    advanceRequestedTotal?: number | null;
    posStage?: string | null;
    hasVigenteAdvance?: boolean;
}): string | null;
export declare function getQuotationSendToCajaBlockedReason(input: {
    generalStatus?: string | null;
    posStage?: string | null;
    hasVigenteAdvance?: boolean;
}): string | null;
