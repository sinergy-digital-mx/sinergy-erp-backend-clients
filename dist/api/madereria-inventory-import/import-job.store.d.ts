export type ImportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type ImportInventoryJobResult = {
    warehouse_id: string;
    warehouse_name: string;
    file_rows: number;
    products_created: Array<{
        sku: string;
        name: string;
        row_number: number;
    }>;
    prices_created: number;
    costs_created: number;
    costs_updated: number;
    batches_created: number;
    skipped: Array<{
        sku: string;
        row_number: number;
        reason: string;
    }>;
    errors: Array<{
        sku: string;
        row_number: number;
        message: string;
    }>;
};
export type ImportInventoryJob = {
    id: string;
    organization_id: string;
    user_id: string;
    status: ImportJobStatus;
    total: number;
    processed: number;
    current_sku: string | null;
    message: string;
    percent: number;
    result: ImportInventoryJobResult | null;
    error: string | null;
    created_at: string;
    updated_at: string;
};
export declare function createImportJob(input: {
    id: string;
    organizationId: string;
    userId: string;
    total: number;
}): ImportInventoryJob;
export declare function getImportJob(jobId: string, organizationId: string): ImportInventoryJob | null;
export declare function updateImportJob(jobId: string, patch: Partial<Pick<ImportInventoryJob, 'status' | 'processed' | 'current_sku' | 'message' | 'result' | 'error' | 'total'>>): void;
