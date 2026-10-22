import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export interface AdvancePaymentAmounts {
    cashMxn: number;
    transferMxn: number;
    cardMxn: number;
    checkMxn: number;
}
export declare function paymentMethodFromFormaPago(formaPago: string | undefined | null): PosSalePaymentMethod | null;
export declare function formaPagoFromPaymentMethod(method: string | undefined | null): string | null;
export declare function formaPagoFromAdvancePayment(method: string | undefined | null, amounts?: AdvancePaymentAmounts): string | null;
export declare function predominantFormaPago(amounts: AdvancePaymentAmounts | undefined | null): string | null;
export declare function advanceShiftAmountSplits(method: string, amountMxn: number, amounts?: Partial<AdvancePaymentAmounts> | null): AdvancePaymentAmounts;
export declare function advancePaymentMethodLabel(method: string): string;
