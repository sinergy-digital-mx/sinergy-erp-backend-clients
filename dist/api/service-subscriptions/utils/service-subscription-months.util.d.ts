export interface CalendarDate {
    year: number;
    month: number;
    day: number;
    isoDate: string;
}
export declare function normalizeMonthStart(value: string): string;
export declare function listPeriodMonths(start: string, end: string): string[];
export declare function addMonths(monthStart: string, count: number): string;
export declare function formatPeriodLabel(monthStart: string): string;
export declare function billingDate(monthStart: string, billingDay: number): string;
export declare function todayInTimeZone(timeZone?: string, now?: Date): CalendarDate;
export declare function isCurrentMonth(monthStart: string, today?: CalendarDate): boolean;
