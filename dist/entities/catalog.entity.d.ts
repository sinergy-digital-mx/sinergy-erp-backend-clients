export declare enum CatalogType {
    PHONE_COUNTRY = "phone_country",
    INDUSTRY = "industry",
    LEAD_SOURCE = "lead_source",
    CUSTOMER_TYPE = "customer_type",
    ACTIVITY_TYPE = "activity_type"
}
export declare class Catalog {
    id: number;
    catalog_type: CatalogType;
    name: string;
    code: string;
    value: string;
    description: string;
    metadata: Record<string, any>;
    is_active: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}
