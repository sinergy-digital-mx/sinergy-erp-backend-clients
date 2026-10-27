export interface OvertimePolicyRules {
    workday_hours: number;
    daily_double_hours: number;
    weekly_double_hours: number;
    double_multiplier: number;
    excess_multiplier: number;
}
export declare const DEFAULT_OVERTIME_POLICY: OvertimePolicyRules;
export interface ResolvedOvertimeSchedule {
    work_date: string;
    start_time: string;
    end_time: string;
    requested_hours: number;
}
export interface OvertimePayAllocation {
    hourly_rate: number;
    daily_salary: number;
    double_hours: number;
    excess_hours: number;
    amount: number;
}
export interface OvertimePaymentDetail {
    workday_hours: number;
    daily_double_hours: number;
    weekly_double_hours: number;
    double_multiplier: number;
    excess_multiplier: number;
    prior_day_hours: number;
    prior_week_hours: number;
    week_start: string;
    week_end: string;
    daily_salary: number;
    monthly_salary: number;
}
export declare function todayInMexico(reference?: Date): string;
export declare function normalizeClock(value: string | null | undefined): string | null;
export declare function calendarDayIndex(isoDate: string): number | null;
export declare function isoFromDayIndex(index: number): string;
export declare function shiftIsoDate(isoDate: string, days: number): string | null;
export declare function weekRange(isoDate: string): {
    week_start: string;
    week_end: string;
} | null;
export declare function minuteRange(workDate: string, startTime: string, endTime: string): [number, number] | null;
export declare function rangesOverlap(left: [number, number], right: [number, number]): boolean;
export declare function resolveOvertimeSchedule(workDate: string, startTime: string, endTime: string, today?: string): {
    ok: true;
    schedule: ResolvedOvertimeSchedule;
} | {
    ok: false;
    message: string;
};
export declare function allocateOvertimePay(input: {
    hours: number;
    monthlySalary: number;
    priorDayHours: number;
    priorWeekHours: number;
    policy: OvertimePolicyRules;
}): OvertimePayAllocation;
export declare function round2(value: number): number;
export declare function round4(value: number): number;
