export declare class StockFlowFiltersAppliedDto {
    period: string;
    period_label: string;
    date_from: string;
    date_to: string;
    fiscal_configuration_id: string;
    billing_branch_id: string | null;
    product_id: string | null;
    view: string;
    currency: string;
}
export declare class StockFlowMoneyBlockDto {
    opening_cost_mxn: string;
    opening_sale_mxn: string;
    purchases_cost_mxn: string;
    sales_cost_mxn: string;
    sales_revenue_mxn: string;
    transfer_in_cost_mxn: string;
    transfer_out_cost_mxn: string;
    adjustments_cost_mxn: string;
    closing_cost_mxn: string;
    closing_sale_mxn: string;
}
export declare class StockFlowSummaryRowDto extends StockFlowMoneyBlockDto {
    product_id: string;
    product_sku: string;
    product_name: string;
    billing_branch_id: string;
    billing_branch_name: string;
    fiscal_configuration_name: string;
    uom_id: string;
    uom_name: string;
    opening_qty: string;
    purchases_qty: string;
    sales_qty: string;
    transfer_in_qty: string;
    transfer_out_qty: string;
    adjustments_qty: string;
    closing_qty: string;
}
export declare class StockFlowTotalizedRowDto extends StockFlowMoneyBlockDto {
    billing_branch_id: string;
    billing_branch_name: string;
    fiscal_configuration_name: string;
    opening_qty: string;
    purchases_qty: string;
    sales_qty: string;
    transfer_in_qty: string;
    transfer_out_qty: string;
    adjustments_qty: string;
    closing_qty: string;
}
export declare class StockFlowLedgerRowDto {
    id: string;
    occurred_at: string;
    product_id: string;
    product_sku: string;
    product_name: string;
    billing_branch_id: string;
    billing_branch_name: string;
    uom_name: string;
    movement_type: string;
    movement_type_label: string;
    title: string;
    description: string;
    quantity_in: string | null;
    quantity_out: string | null;
    balance_after: string;
    unit_cost_mxn: string | null;
    unit_sale_price_mxn: string | null;
    cost_amount_mxn: string | null;
    sale_amount_mxn: string | null;
    cost_balance_after_mxn: string | null;
    reference_folio: string | null;
    is_opening: boolean;
}
export declare class StockFlowResponseDto {
    filters_applied: StockFlowFiltersAppliedDto;
    summary: StockFlowSummaryRowDto[];
    totalized: StockFlowTotalizedRowDto[];
    ledger: StockFlowLedgerRowDto[];
    total_summary_rows: number;
    total_totalized_rows: number;
    total_ledger_rows: number;
}
