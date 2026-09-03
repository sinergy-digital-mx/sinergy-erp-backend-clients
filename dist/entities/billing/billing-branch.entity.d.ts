import { FiscalConfiguration } from './fiscal-configuration.entity';
export declare class BillingBranch {
    id: string;
    fiscal_configuration_id: string;
    fiscal_configuration: FiscalConfiguration;
    code: string;
    prefix: string | null;
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
    status: number;
    warehouses: any[];
    created_at: Date;
    updated_at: Date;
}
