import { Exclude, Expose, Type } from 'class-transformer';
import { MailerVendor } from '../enums/mailer-vendor.enum';
import type { VendorConfig } from '../interfaces/vendor-config.interface';
import type { TestResult } from '../interfaces/test-result.interface';

/**
 * DTO for API responses containing mailer configuration data
 * Excludes sensitive fields and masks credentials in vendor configuration
 * Used for all API responses to ensure sensitive data is not exposed
 */
@Exclude()
export class MailerConfigurationDto {
  /**
   * Unique identifier for the mailer configuration
   */
  @Expose()
  id: string;

  /**
   * Tenant ID this configuration belongs to
   */
  @Expose()
  tenantId: string;

  /**
   * Name of the mailer configuration
   */
  @Expose()
  name: string;

  /**
   * Email service provider vendor type
   */
  @Expose()
  vendor: MailerVendor;

  /**
   * Vendor-specific configuration with masked sensitive fields
   * Sensitive fields (apiKey, password, etc.) are masked showing only last 4 characters
   */
  @Expose()
  vendorConfig: VendorConfig;

  /**
   * Whether this is the active configuration for the tenant
   */
  @Expose()
  isActive: boolean;

  /**
   * Whether this is the fallback configuration for the tenant
   */
  @Expose()
  isFallback: boolean;

  /**
   * Whether this configuration has passed validation
   */
  @Expose()
  isValid: boolean;

  /**
   * Timestamp when the configuration was created
   */
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  /**
   * User ID who created the configuration
   */
  @Expose()
  createdBy: string;

  /**
   * Timestamp when the configuration was last updated
   */
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  /**
   * User ID who last updated the configuration
   */
  @Expose()
  updatedBy: string;

  /**
   * Result of the last test performed on this configuration (optional)
   */
  @Expose()
  @Type(() => Object)
  lastTestResult?: TestResult;

  /**
   * Timestamp of the last test performed on this configuration (optional)
   */
  @Expose()
  @Type(() => Date)
  lastTestTimestamp?: Date;

  /**
   * Timestamp of the last time this configuration was used to send an email (optional)
   */
  @Expose()
  @Type(() => Date)
  lastUsedTimestamp?: Date;
}
