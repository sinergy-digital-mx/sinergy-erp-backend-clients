export type PropertyImportJobStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type PropertyImportJobResult = {
    created: number;
};
export type PropertyImportJob = {
    id: string;
    organization_id: string;
    status: PropertyImportJobStatus;
    total: number;
    processed: number;
    percent: number;
    current_code: string | null;
    message: string;
    result: PropertyImportJobResult | null;
    error: string | null;
    created_at: string;
    updated_at: string;
};
export declare function createPropertyImportJob(input: {
    id: string;
    organizationId: string;
    total: number;
}): PropertyImportJob;
export declare function getPropertyImportJob(jobId: string, organizationId: string): PropertyImportJob | null;
export declare function updatePropertyImportJob(jobId: string, patch: Partial<Pick<PropertyImportJob, 'status' | 'processed' | 'total' | 'current_code' | 'message' | 'result' | 'error'>>): void;
