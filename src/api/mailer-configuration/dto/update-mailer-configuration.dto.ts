import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import type { VendorConfig } from '../interfaces/vendor-config.interface';

/**
 * DTO for updating an existing mailer configuration
 * All fields are optional, allowing partial updates
 */
export class UpdateMailerConfigurationDto {
  @ApiPropertyOptional({ example: 'Resend Produccion' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: {
      apiKey: 're_xxxxxxxxxxxxxxxxx',
      fromEmail: 'noreply@tu-dominio.com',
      fromName: 'Synergy ERP',
      replyTo: 'soporte@tu-dominio.com',
    },
  })
  @IsOptional()
  @IsObject()
  vendorConfig?: VendorConfig;

  @ApiPropertyOptional({ example: 're_xxxxxxxxxxxxxxxxx', description: 'Legacy shortcut for Resend api key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFallback?: boolean;
}
