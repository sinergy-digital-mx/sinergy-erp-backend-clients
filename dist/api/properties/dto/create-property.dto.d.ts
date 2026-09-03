export declare class CreatePropertyDto {
    code: string;
    block?: string;
    lot_number?: string;
    cadastral_key?: string;
    name: string;
    description?: string;
    location?: string;
    group_id: string;
    total_area: number;
    measurement_unit_id: string;
    total_price?: number;
    price_per_m2?: number;
    currency?: 'USD' | 'MXN';
    status?: string;
    metadata?: Record<string, any>;
}
