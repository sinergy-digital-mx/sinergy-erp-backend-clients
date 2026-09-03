"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapCustomerCheckoutFields = mapCustomerCheckoutFields;
function mapCustomerCheckoutFields(customer, credits, fiscal, activeCredit) {
    return {
        credits,
        credit_enabled: activeCredit.credit_enabled,
        credit_days: activeCredit.credit_days,
        credit_amount: activeCredit.credit_amount,
        credit_used: activeCredit.credit_used,
        credit_available: activeCredit.credit_available,
        credit_usage_percent: activeCredit.credit_usage_percent,
        auto_generate_invoice: Boolean(customer.auto_generate_invoice),
        fiscal_ready_for_invoice: fiscal.fiscal_ready_for_invoice,
        fiscal_missing_fields: fiscal.fiscal_missing_fields,
    };
}
//# sourceMappingURL=map-customer-checkout.util.js.map