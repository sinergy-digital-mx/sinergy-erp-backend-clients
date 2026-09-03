import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
export type ProductSearchFields = {
    sku?: string | null;
    name?: string | null;
    external_sku?: string | null;
};
type ProductSearchRank = {
    tier: number;
    position: number;
    length: number;
    name: string;
};
export declare function normalizeProductSearchText(value: string | null | undefined): string;
export declare function parseProductSearchTokens(search: string | null | undefined): string[];
export declare function getProductSearchQuery(search: string | undefined): string;
export declare function productSearchOrderParams(query: string): Record<string, string>;
export declare function applyProductSearchFilter<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, search: string | undefined, alias?: string): void;
export declare function applyProductSearchOrder<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, search: string | undefined, grouped?: boolean): boolean;
export declare function buildProductSearchRankSql(grouped?: boolean): string;
export declare function compareProductSearchRelevance(a: ProductSearchFields, b: ProductSearchFields, search: string): number;
export declare function getProductSearchRank(product: ProductSearchFields, search: string): ProductSearchRank;
export {};
