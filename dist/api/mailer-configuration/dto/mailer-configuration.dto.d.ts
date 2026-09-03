import { MailerVendor } from '../enums/mailer-vendor.enum';
import type { VendorConfig } from '../interfaces/vendor-config.interface';
import type { TestResult } from '../interfaces/test-result.interface';
export declare class MailerConfigurationDto {
    id: string;
    tenantId: string;
    name: string;
    vendor: MailerVendor;
    vendorConfig: VendorConfig;
    isActive: boolean;
    isFallback: boolean;
    isValid: boolean;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    lastTestResult?: TestResult;
    lastTestTimestamp?: Date;
    lastUsedTimestamp?: Date;
}
