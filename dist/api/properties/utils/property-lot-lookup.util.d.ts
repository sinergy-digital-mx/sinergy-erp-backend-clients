export interface PropertyLotLookup {
    id: string;
    code: string;
    name: string;
    block: string | null;
    lot_number: string | null;
    status: string;
    total_area: number;
    total_price: number;
    price_per_m2: number | null;
    currency: string;
}
export interface PropertyLotLookupInput {
    id: string;
    code: string;
    name: string;
    block?: string | null;
    lot_number?: string | null;
    status: string;
    total_area: number | string;
    total_price: number | string;
    price_per_m2?: number | string | null;
    currency?: string | null;
}
export declare function toPropertyLotLookup(property: PropertyLotLookupInput): PropertyLotLookup;
