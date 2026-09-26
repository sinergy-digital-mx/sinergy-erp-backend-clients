export declare function cashReceivedEquivalentMxn(receivedMxn: number, receivedUsd: number, rate: number): number;
export declare function usdCentToleranceMxn(rate: number): number;
export interface CashPaymentSplit {
    amountCashMxn: number;
    amountCashUsd: number;
    changeCashMxn: number;
    changeCashUsd: number;
    covers: boolean;
}
export declare function splitCashPayment(orderTotal: number, receivedMxn: number, receivedUsd: number, rate: number): CashPaymentSplit;
export declare function cashCoversOrder(orderTotal: number, receivedMxn: number, receivedUsd: number, rate: number): boolean;
