import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDate,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MailerVendor } from '../enums/mailer-vendor.enum';

/**
 * DTO for querying mailer configurations with filtering and pagination options
 * All fields are optional, allowing flexible filtering
 */
export class QueryMailerConfigurationDto {
  /**
   * Filter by vendor type (optional)
   */
  @IsOptional()
  @IsEnum(MailerVendor)
  vendor?: MailerVendor;

  /**
   * Filter by active status (optional)
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  /**
   * Filter by fallback status (optional)
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFallback?: boolean;

  /**
   * Filter configurations created after this date (optional)
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAfter?: Date;

  /**
   * Filter configurations created before this date (optional)
   */
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdBefore?: Date;

  /**
   * Page number for pagination (default: 1)
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  /**
   * Number of items per page (default: 10, max: 100)
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
