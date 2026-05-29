import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { MailerVendor } from '../enums/mailer-vendor.enum';
import type { VendorConfig } from '../interfaces/vendor-config.interface';

/**
 * DTO for creating a new mailer provider configuration.
 */
export class CreateMailerConfigurationDto {
  @ApiProperty({ example: 'Resend Produccion' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: MailerVendor, example: MailerVendor.RESEND })
  @IsOptional()
  @IsEnum(MailerVendor)
  vendor?: MailerVendor = MailerVendor.RESEND;

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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFallback?: boolean;
}

export class ResendMailerConfigurationPayloadDto {
  @ApiProperty({ example: 're_xxxxxxxxxxxxxxxxx' })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiProperty({ example: 'noreply@tu-dominio.com' })
  @IsNotEmpty()
  @IsString()
  fromEmail: string;

  @ApiPropertyOptional({ example: 'Synergy ERP' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ example: 'soporte@tu-dominio.com' })
  @IsOptional()
  @IsString()
  replyTo?: string;
}
