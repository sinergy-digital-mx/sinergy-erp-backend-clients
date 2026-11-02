export interface WarehouseLocationInput {
    name?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    country?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
}
export interface NormalizedWarehouseLocation {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
}
export declare function describeWarehouseLocationIssue(input: WarehouseLocationInput): string | null;
export declare function assertWarehouseLocation(input: WarehouseLocationInput): NormalizedWarehouseLocation;
export declare function mapWarehousePersistError(error: unknown, warehouseName?: string | null): never;
