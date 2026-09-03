export declare class Module {
    id: string;
    name: string;
    code: string;
    description: string;
    category: string | null;
    sort_order: number;
    permissions: any[];
    tenant_modules: any[];
    created_at: Date;
}
