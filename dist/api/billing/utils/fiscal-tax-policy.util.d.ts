import { DataSource, EntityManager } from 'typeorm';
export interface FiscalTaxPolicy {
    ivaEnabled: boolean;
    iepsEnabled: boolean;
}
type Queryable = Pick<DataSource | EntityManager, 'query'>;
export declare function isFiscalFlagOn(value: unknown, fallback?: boolean): boolean;
export declare function readFiscalTaxPolicy(row: {
    iva_enabled?: unknown;
    ieps_enabled?: unknown;
} | null | undefined): FiscalTaxPolicy;
export declare function clampTaxPercentages(ivaPercentage: number, iepsPercentage: number, policy: FiscalTaxPolicy): {
    ivaPercentage: number;
    iepsPercentage: number;
};
export declare function loadFiscalTaxPolicy(db: Queryable, fiscalConfigurationId: string, tenantId: string): Promise<FiscalTaxPolicy>;
export {};
