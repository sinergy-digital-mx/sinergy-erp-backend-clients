export declare class S3Service {
    private s3Client;
    private bucketName;
    constructor();
    uploadFile(tenantId: string, entityId: number | string, documentType: string, file: Buffer, fileName: string, mimeType: string): Promise<string>;
    uploadEntityFile(tenantId: string, entityType: string, entityId: number | string, documentType: string, file: Buffer, fileName: string, mimeType: string): Promise<string>;
    private toSafePathSegment;
    getSignedUrl(s3Key: string, expiresIn?: number): Promise<string>;
    getFileBuffer(s3Key: string): Promise<Buffer>;
    deleteFile(s3Key: string): Promise<void>;
}
