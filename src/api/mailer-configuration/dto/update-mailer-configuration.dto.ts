import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating an existing Resend configuration
 * All fields are optional, allowing partial updates
 */
export class UpdateMailerConfigurationDto {
  /**
   * Updated name of the Resend configuration (optional)
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Updated Resend API key (optional)
   */
  @IsOptional()
  @IsString()
  apiKey?: string;
}
