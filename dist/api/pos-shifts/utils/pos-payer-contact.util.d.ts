export interface PayerContactInput {
    transfer_payer_name?: string | null;
    transfer_payer_business_name?: string | null;
    card_payer_name?: string | null;
    card_payer_phone?: string | null;
    check_payer_name?: string | null;
    check_payer_phone?: string | null;
}
export interface PayerContactAmounts {
    transferMxn: number;
    cardMxn: number;
    checkMxn: number;
    checkUsd?: number;
}
export interface PayerContact {
    transferPayerName: string | null;
    transferPayerBusinessName: string | null;
    cardPayerName: string | null;
    cardPayerPhone: string | null;
    checkPayerName: string | null;
    checkPayerPhone: string | null;
}
export declare function resolvePayerContact(input: PayerContactInput, amounts: PayerContactAmounts): {
    error: string | null;
    contact: PayerContact;
};
export declare function formatPayerContactSummary(contact: PayerContact): string | null;
