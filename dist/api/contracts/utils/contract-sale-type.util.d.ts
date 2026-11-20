export type ContractSaleType = 'cash' | 'financed';
export type ContractSaleMark = 'cash' | 'down_payment_and_financing' | 'financing';
type SaleContract = {
    sale_type?: string | null;
    down_payment_financed?: boolean | null;
};
export declare function isCashContract(contract: SaleContract | null | undefined): boolean;
export declare function resolveContractSaleMark(contract: SaleContract | null | undefined): ContractSaleMark;
export declare function contractSaleTypeLabel(contract: SaleContract | null | undefined): string;
export declare function contractSaleTypeHint(contract: SaleContract | null | undefined): string;
export {};
