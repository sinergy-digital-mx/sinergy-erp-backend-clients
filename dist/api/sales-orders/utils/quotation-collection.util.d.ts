export interface CollectionActionInput {
    fromQuotation: boolean;
    generalStatus: string;
    paymentStatus: string;
    salesOrderType: string;
    onOpenShift: boolean;
    hasCollection: boolean;
    hasPayments: boolean;
    hasVigenteInvoice: boolean;
    hasOpenShift: boolean;
}
export interface CollectionActionState {
    canSend: boolean;
    canWithdraw: boolean;
    sendBlockedReason: string | null;
    withdrawBlockedReason: string | null;
}
export declare function resolveCollectionActions(input: CollectionActionInput): CollectionActionState;
