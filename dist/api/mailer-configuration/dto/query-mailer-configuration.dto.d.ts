import { MailerVendor } from '../enums/mailer-vendor.enum';
export declare class QueryMailerConfigurationDto {
    vendor?: MailerVendor;
    isActive?: boolean;
    isFallback?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    page?: number;
    limit?: number;
}
