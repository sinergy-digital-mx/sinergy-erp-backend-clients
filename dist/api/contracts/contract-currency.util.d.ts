export declare const DEFAULT_CONTRACT_CURRENCY = "USD";
export declare const CONTRACT_CURRENCIES: readonly ["USD", "MXN"];
export type ContractCurrency = (typeof CONTRACT_CURRENCIES)[number];
export declare function isContractCurrency(value: string): value is ContractCurrency;
export declare function resolveStoredContractCurrency(value?: string | null): ContractCurrency;
export declare function normalizeContractCurrency(value?: string | null, fallback?: string): ContractCurrency;
