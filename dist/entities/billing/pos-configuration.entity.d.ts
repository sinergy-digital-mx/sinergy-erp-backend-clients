import { BillingBranch } from './billing-branch.entity';
export declare class PosConfiguration {
    static readonly ALLOWED_TYPES: readonly ["VENTAS", "COBRANZA"];
    id: string;
    tenant_id: string;
    code: string;
    type: (typeof PosConfiguration.ALLOWED_TYPES)[number];
    sucursal: string;
    modelo?: string;
    status: number;
    branch: BillingBranch;
    created_at: Date;
    updated_at: Date;
}
