import { RBACTenant } from '../rbac/tenant.entity';
import { PosDailyShift } from './pos-daily-shift.entity';
import { PosSalePaymentMethod } from './pos-sale-payment-method.enum';
export declare class AdvanceShiftPayment {
    id: string;
    tenant_id: string;
    tenant: RBACTenant;
    quotation_id: string | null;
    sales_order_id: string | null;
    electronic_invoice_id: string;
    pos_daily_shift_id: string;
    pos_daily_shift: PosDailyShift;
    payment_method: PosSalePaymentMethod;
    amount_mxn: number;
    document_folio: string;
    collected_by_user_id: string;
    sales_order_payment_id: string | null;
    voided_at: Date | null;
    created_at: Date;
}
