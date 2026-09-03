import { BillingBranch } from './billing-branch.entity';
export declare class FiscalConfiguration {
    id: string;
    tenant_id: string;
    razon_social: string;
    rfc: string;
    prefix: string | null;
    persona_type: string;
    fiscal_regime: string;
    digital_seal: string;
    digital_seal_password: string;
    private_key: string;
    logo: string;
    status: string;
    created_by: string | null;
    certificate_serial_number: string | null;
    finkok_registration_status: string;
    finkok_registered_at: Date | null;
    finkok_registration_error: string | null;
    finkok_remote_status: string | null;
    finkok_stamps_counter: number | null;
    finkok_stamps_credit: number | null;
    last_finkok_sync_at: Date | null;
    branches: BillingBranch[];
    created_at: Date;
    updated_at: Date;
}
