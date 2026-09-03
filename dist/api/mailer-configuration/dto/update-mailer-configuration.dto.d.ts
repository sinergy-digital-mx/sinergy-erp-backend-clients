import type { VendorConfig } from '../interfaces/vendor-config.interface';
export declare class UpdateMailerConfigurationDto {
    name?: string;
    vendorConfig?: VendorConfig;
    apiKey?: string;
    isFallback?: boolean;
}
