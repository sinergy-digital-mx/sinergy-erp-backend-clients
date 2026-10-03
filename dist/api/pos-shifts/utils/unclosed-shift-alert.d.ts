export type UnclosedShiftAlert = {
    active: true;
    daily_shift_id: string;
    shift_date: string;
    today: string;
    days_open: number;
    title: string;
    message: string;
    severity: 'blocking';
};
export declare const POS_CALENDAR_TIMEZONE = "America/Tijuana";
export declare function posCalendarDateSql(column: string): string;
export declare function getTodayDateString(now?: Date): string;
export declare function toDateOnlyString(value: string | Date): string;
export declare function resolvePosCalendarRange(period: 'today' | 'week' | 'month' | 'range', dateFrom?: string, dateTo?: string, now?: Date): {
    from: string;
    to: string;
};
export declare function isPreviousDayOpenShift(shiftDate: string | Date, today?: string): boolean;
export declare function buildUnclosedShiftAlert(shift: {
    id: string;
    shift_date: string | Date;
} | null | undefined, today?: string): UnclosedShiftAlert | null;
