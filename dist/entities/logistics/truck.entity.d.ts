import { RBACTenant } from '../rbac/tenant.entity';
export declare class Truck {
    id: string;
    tenant: RBACTenant;
    tenant_id: string;
    name: string;
    code: string | null;
    placa: string | null;
    serial_number: string | null;
    anio: string | null;
    permiso_sct: string | null;
    numero_permiso_sct: string | null;
    tipo_auto_transporte: string | null;
    aseguradora_rc: string | null;
    poliza_rc: string | null;
    subtipo_remolque1: string | null;
    placa_remolque1: string | null;
    photo: string | null;
    status: string;
    created_at: Date;
    updated_at: Date;
}
