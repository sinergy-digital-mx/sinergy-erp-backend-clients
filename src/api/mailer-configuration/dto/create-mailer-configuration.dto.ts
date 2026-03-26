import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for creating a new Resend configuration
 */
export class CreateMailerConfigurationDto {
  /**
   * Name of the Resend configuration (unique per tenant)
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Resend API key
   */
  @IsNotEmpty()
  @IsString()
  apiKey: string;
}
