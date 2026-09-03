export declare function roundPoMoney(value: number): number;
export declare function roundPoUnitCost(value: number): number;
export interface RequestedLineBreakdown {
    line_subtotal: number;
    line_iva: number;
    line_ieps: number;
    line_total: number;
    iva_unit: number;
    ieps_unit: number;
}
export interface ReceivedLineBreakdown {
    received_line_subtotal: number;
    received_line_iva: number;
    received_line_ieps: number;
    received_line_total: number;
}
export declare function computeRequestedLineBreakdown(quantity: number, unitTotal: number, ivaPercentage: number, iepsPercentage: number): RequestedLineBreakdown;
export declare function computeReceivedLineBreakdown(quantity: number, unitTotal: number, ivaPercentage: number, iepsPercentage: number): ReceivedLineBreakdown;
