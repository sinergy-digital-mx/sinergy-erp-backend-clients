export interface CustomerCreditSnapshot {
    credit_enabled: boolean;
    credit_days: number | null;
    credit_amount: number;
    credit_used: number;
    credit_available: number;
    credit_usage_percent: number;
}
export interface CustomerCreditFiscalSnapshot extends CustomerCreditSnapshot {
    fiscal_configuration_id: string;
    razon_social: string;
    rfc: string;
    fiscal_status: string;
}
export declare function parseOptionalBoolean(value: unknown): boolean | undefined;
export declare function parseOptionalNumber(value: unknown): number | undefined;
export declare function extractCreditPatchFromBody(body: Record<string, unknown>): {
    credit_enabled: boolean;
    credit_days?: number | null;
    credit_amount?: number | null;
} | null;
export declare function buildCreditSnapshot(params: {
    creditEnabled: boolean;
    creditDays?: number | null;
    creditAmount?: number | string | null;
    creditUsed?: number | string | null;
}): CustomerCreditSnapshot;
