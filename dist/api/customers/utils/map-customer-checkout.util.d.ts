import { Customer } from '../../../entities/customers/customer.entity';
import { CustomerCreditFiscalSnapshot, CustomerCreditSnapshot } from '../utils/customer-credit.util';
import { FiscalInvoiceReadiness } from '../utils/fiscal-invoice-readiness.util';
export declare function mapCustomerCheckoutFields(customer: Customer, credits: CustomerCreditFiscalSnapshot[], fiscal: FiscalInvoiceReadiness, activeCredit: CustomerCreditSnapshot): {
    credits: CustomerCreditFiscalSnapshot[];
    credit_enabled: boolean;
    credit_days: number | null;
    credit_amount: number;
    credit_used: number;
    credit_available: number;
    credit_usage_percent: number;
    auto_generate_invoice: boolean;
    fiscal_ready_for_invoice: boolean;
    fiscal_missing_fields: ("fiscal_rfc" | "fiscal_razon_social" | "fiscal_postal_code")[];
};
