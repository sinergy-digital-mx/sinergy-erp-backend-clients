import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export declare class CreateSalesOrderPaymentDto {
    amount: number;
    payment_date: string;
    payment_method: PosSalePaymentMethod;
    currency?: 'MXN' | 'USD';
    reference_number?: string;
    notes?: string;
}
