export declare function toDateOnlyString(value: Date | string): string;
export declare function addCalendarDays(value: Date | string, days: number): string;
export declare function normalizeExpirationDays(value: unknown): number | null;
export declare function resolveQuotationExpiresAt(createdAt: Date | string | null | undefined, expirationDays: unknown): string | null;
export declare function isQuotationExpired(createdAt: Date | string, expirationDays: unknown, today?: Date | string): boolean;
