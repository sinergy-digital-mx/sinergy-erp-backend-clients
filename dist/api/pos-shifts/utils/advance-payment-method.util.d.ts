import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
export declare function paymentMethodFromFormaPago(formaPago: string | undefined | null): PosSalePaymentMethod | null;
export declare function advancePaymentMethodLabel(method: string): string;
