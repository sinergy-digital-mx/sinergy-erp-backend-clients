export declare const MIN_AGUINALDO_DAYS = 15;
export declare const VACATION_PREMIUM_RATE = 0.25;
export declare function completedYearsOfService(hireDate: Date | string | null | undefined, reference?: Date): number;
export declare function vacationDaysForYears(completedYears: number): number;
export declare function currentAnniversaryStart(hireDate: Date | string, reference?: Date): Date;
export interface VacationSummary {
    hire_date: string | null;
    years_of_service: number;
    entitled_days: number;
    carryover_days: number;
    balance_days: number;
    taken_days: number;
    pending_days: number;
    available_days: number;
    current_period_start: string | null;
}
export declare function buildVacationSummary(hireDate: Date | string | null | undefined, takenDaysThisPeriod?: number, pendingDaysThisPeriod?: number, carryoverDays?: number, reference?: Date): VacationSummary;
export interface PayrollSummary {
    monthly_salary: number;
    daily_salary: number;
    biweekly_salary: number;
    weekly_salary: number;
    annual_salary: number;
    integration_factor: number;
    integrated_daily_salary: number;
}
export declare function buildPayrollSummary(monthlySalary: number | null | undefined, completedYears: number): PayrollSummary | null;
export declare function parseCalendarDate(value: Date | string): Date;
export declare function inclusiveDayCount(start: Date | string, end: Date | string): number;
export declare function inclusiveBusinessDayCount(start: Date | string, end: Date | string): number;
export declare function resolveLeaveDays(params: {
    type: string;
    startDate: Date | string;
    endDate: Date | string;
    days?: number | null;
    countWeekends?: boolean | null;
}): {
    days: number;
    counted_weekends: boolean;
    calendar_days: number;
};
