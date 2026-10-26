export declare const MEDICAL_CERTIFICATE_MAX_BYTES: number;
export declare const MEDICAL_CERTIFICATE_MAX_FILES = 8;
export interface UploadLike {
    size?: number;
    mimetype?: string;
    originalname?: string;
    buffer?: Buffer;
}
export declare function assertMedicalCertificateFile(file: UploadLike | null | undefined): void;
export declare function sanitizeUploadFileName(name: string | undefined): string;
