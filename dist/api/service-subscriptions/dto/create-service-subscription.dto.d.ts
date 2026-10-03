export declare class CreateServiceSubscriptionDto {
    customer_id: number;
    title: string;
    monthly_amount: number;
    iva_percentage?: number;
    fiscal_configuration_id: string;
    billing_branch_id: string;
    product_id: string;
    product_uom_id: string;
    start_month: string;
    end_month: string;
    billing_day?: number;
    uso_cfdi?: string;
    forma_pago?: string;
    metodo_pago?: string;
    regimen_fiscal_receptor?: string;
    notes?: string;
}
