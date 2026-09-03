import { MailerVendor } from '../enums/mailer-vendor.enum';
import type { VendorConfig } from '../interfaces/vendor-config.interface';
export declare class CreateMailerConfigurationDto {
    name: string;
    vendor?: MailerVendor;
    vendorConfig?: VendorConfig;
    apiKey?: string;
    isActive?: boolean;
    isFallback?: boolean;
}
export declare class ResendMailerConfigurationPayloadDto {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
    replyTo?: string;
}
