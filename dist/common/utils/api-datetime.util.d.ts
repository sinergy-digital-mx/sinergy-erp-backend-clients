export declare function parseDbDateTimeAsUtc(value: Date | string | null | undefined): Date | null;
export declare function parseDateOnly(value: Date | string | null | undefined): Date | null;
export declare function formatDateOnly(date: Date): string;
export declare function getCalendarMonthKey(value: Date | string | null | undefined): string;
export declare function isUnpaidOverdue(dueDate: Date | string | null | undefined, status: string, today?: Date): boolean;
