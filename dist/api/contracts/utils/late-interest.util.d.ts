export interface LateInterestConfig {
    ratePercent: number;
    graceDays: number;
}
export interface LateInterestPaymentInput {
    amount: number;
    status: string;
    due_date?: Date | string | null;
    late_interest_amount?: number | string | null;
    late_interest_waived?: boolean | null;
}
export interface LateInterestResolution {
    late_interest_amount: number;
    late_interest_suggested: number;
    late_interest_waived: boolean;
    late_interest_eligible: boolean;
    late_interest_manual: boolean;
    late_interest_days_overdue: number;
    late_interest_rate_percent: number;
    late_interest_grace_days: number;
}
export declare function normalizeInterestRatePercent(raw: number | string | null | undefined): number;
export declare function normalizeGraceDays(raw: number | string | null | undefined): number;
export declare function resolveLateInterestConfig(contract: {
    interest_rate?: number | string | null;
    payment_due_day?: number | string | null;
}): LateInterestConfig;
export declare function countDaysPastDue(dueDate: Date | string | null | undefined, today?: Date): number;
export declare function isLateInterestEligible(status: string, daysPastDue: number, config: LateInterestConfig): boolean;
export declare function computeSuggestedLateInterest(amount: number, config: LateInterestConfig, eligible: boolean): number;
export declare function resolveLateInterest(payment: LateInterestPaymentInput, config: LateInterestConfig, today?: Date): LateInterestResolution;
