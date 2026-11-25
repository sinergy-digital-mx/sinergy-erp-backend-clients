export declare const CUSTOMER_LIST_PREFILTERS: readonly ["off", "sellers", "everyone"];
export type CustomerListPrefilter = (typeof CUSTOMER_LIST_PREFILTERS)[number];
export interface CustomerListSettings {
    prefilter: CustomerListPrefilter;
}
export declare function normalizeCustomerListSettings(raw: unknown): CustomerListSettings;
export declare function shouldPrefilterCustomerList(prefilter: CustomerListPrefilter, canViewAll: boolean): boolean;
