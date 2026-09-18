import { Vendor } from '../../../entities/vendor/vendor.entity';
export type VendorMatchReason = 'rfc' | 'tax_id' | 'name' | 'company' | 'bank';
export interface VendorSimilarMatch {
    id: string;
    name: string;
    company_name: string | null;
    rfc: string | null;
    tax_id: string | null;
    match_reasons: VendorMatchReason[];
    score: number;
}
export declare function computeVendorCompleteness(vendor: Partial<Vendor>): number;
export declare function normalizeVendorName(value?: string | null): string | null;
export declare function normalizeFiscalId(value?: string | null): string | null;
export declare function normalizeBankId(value?: string | null): string | null;
export declare function findSimilarVendors(vendor: Partial<Vendor> & {
    id?: string;
}, catalog: Array<Partial<Vendor> & {
    id: string;
}>, limit?: number): VendorSimilarMatch[];
export declare function pickBestSimilarVendor<T extends {
    id: string;
}>(matches: VendorSimilarMatch[], catalog: T[], purchaseCounts: Map<string, number>, completeness: Map<string, number>): T | null;
