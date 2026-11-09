export declare const DEFAULT_PUBLIC_INVOICE_TIME_ZONE = "America/Tijuana";
export declare const MEXICO_TIME_ZONES: readonly [{
    readonly id: "America/Tijuana";
    readonly label: "Tijuana";
}, {
    readonly id: "America/Hermosillo";
    readonly label: "Hermosillo";
}, {
    readonly id: "America/Mazatlan";
    readonly label: "Mazatlán";
}, {
    readonly id: "America/Chihuahua";
    readonly label: "Chihuahua";
}, {
    readonly id: "America/Mexico_City";
    readonly label: "Ciudad de México";
}, {
    readonly id: "America/Monterrey";
    readonly label: "Monterrey";
}, {
    readonly id: "America/Matamoros";
    readonly label: "Matamoros";
}, {
    readonly id: "America/Ojinaga";
    readonly label: "Ojinaga";
}, {
    readonly id: "America/Bahia_Banderas";
    readonly label: "Bahía de Banderas";
}, {
    readonly id: "America/Merida";
    readonly label: "Mérida";
}, {
    readonly id: "America/Cancun";
    readonly label: "Cancún";
}];
export declare const MEXICO_TIME_ZONE_IDS: string[];
export interface PublicInvoicePolicy {
    autoEnabled: boolean;
    blockAfterMonth: boolean;
    hour: number | null;
    timeZone: string;
}
export interface PublicInvoicePolicySource {
    global_invoice_auto_enabled?: unknown;
    global_invoice_block_after_month?: unknown;
    global_invoice_hour?: unknown;
    global_invoice_timezone?: unknown;
}
export interface PublicInvoicePolicyView {
    auto_enabled: boolean;
    block_after_month: boolean;
    hour: number | null;
    timezone: string;
    timezone_label: string;
    calendar_month: string;
}
export interface PublicInvoiceSettingsInput {
    global_invoice_auto_enabled?: boolean;
    global_invoice_block_after_month?: boolean;
    global_invoice_hour?: number | null;
    global_invoice_timezone?: string | null;
}
export interface PublicInvoiceSettings {
    global_invoice_auto_enabled: boolean;
    global_invoice_block_after_month: boolean;
    global_invoice_hour: number | null;
    global_invoice_timezone: string | null;
}
interface ZonedParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
}
export declare function isMexicoTimeZone(value: string): boolean;
export declare function mexicoTimeZoneLabel(timeZone: string): string;
export declare function readPublicInvoicePolicy(row: PublicInvoicePolicySource | null | undefined): PublicInvoicePolicy;
export declare function toPublicInvoicePolicyView(row: PublicInvoicePolicySource | null | undefined, now?: Date): PublicInvoicePolicyView;
export declare function resolvePublicInvoiceSettings(input: PublicInvoiceSettingsInput, current?: PublicInvoicePolicySource | null): PublicInvoiceSettings;
export declare function currentMonthInTimeZone(timeZone: string, now?: Date): string;
export declare function automaticRunPeriod(policy: PublicInvoicePolicy, now?: Date): {
    year: number;
    month: number;
} | null;
export declare function isOrderMonthClosed(createdAt: Date | string | null | undefined, policy: PublicInvoicePolicy, now?: Date): boolean;
export declare function assertOrderMonthStillOpen(createdAt: Date | string | null | undefined, fiscal: PublicInvoicePolicySource | null | undefined, now?: Date): void;
export declare function orderMonthClosedMessage(createdAt: Date | string | null | undefined, policy: PublicInvoicePolicy): string;
export declare function lastDayOfMonth(year: number, month: number): number;
export declare function zonedParts(date: Date, timeZone: string): ZonedParts;
export declare function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date;
export {};
