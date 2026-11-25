import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
declare const ABONO_METHODS: readonly [PosSalePaymentMethod.CASH, PosSalePaymentMethod.CARD, PosSalePaymentMethod.TRANSFER, PosSalePaymentMethod.CHECK];
export declare class RegisterPosAbonoDto {
    amount: number;
    payment_date: string;
    payment_method: (typeof ABONO_METHODS)[number];
    reference_number?: string;
    billing_branch_id?: string;
}
export {};
