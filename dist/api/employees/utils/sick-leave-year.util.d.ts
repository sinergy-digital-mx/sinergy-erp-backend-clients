export interface SickLeaveSpan {
    start_date: Date | string;
    end_date: Date | string;
    days: number | string;
    status: string;
}
export interface SickLeaveYearSummary {
    year: number;
    approved_days: number;
    pending_days: number;
    request_count: number;
}
export declare function calendarYearInMexico(reference?: Date): number;
export declare function sickLeaveDaysInYear(request: SickLeaveSpan, year: number): number;
export declare function summarizeSickLeaveYear(requests: SickLeaveSpan[], year: number): SickLeaveYearSummary;
