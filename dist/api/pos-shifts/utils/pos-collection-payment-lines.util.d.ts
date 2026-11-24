import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export type PosTenderPaymentLine = {
    method: PosSalePaymentMethod.CASH | PosSalePaymentMethod.CARD | PosSalePaymentMethod.TRANSFER | PosSalePaymentMethod.CHECK;
    amount: number;
    reference: string | null;
    notes: string | null;
};
export type PosCollectionTenderInput = {
    amountCashMxn?: number | string | null;
    amountCashUsd?: number | string | null;
    usdExchangeRate?: number | string | null;
    amountTransferMxn?: number | string | null;
    transferReference?: string | null;
    cardPayments?: unknown;
    amountCardMxn?: number | string | null;
    cardReference?: string | null;
    cardKind?: string | null;
    amountCheckMxn?: number | string | null;
    amountCheckUsd?: number | string | null;
    checkReference?: string | null;
};
export declare function buildPosTenderPaymentLines(input: PosCollectionTenderInput, targetMxn: number): PosTenderPaymentLine[] | null;
export declare function assignPosTenderCashierNotes(lines: PosTenderPaymentLine[], cashierNotes: string | null | undefined): PosTenderPaymentLine[];
