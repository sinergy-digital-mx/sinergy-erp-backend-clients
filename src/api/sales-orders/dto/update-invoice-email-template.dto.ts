import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateInvoiceEmailTemplateDto {
  @IsOptional()
  @IsBoolean()
  reset_default?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  body_html?: string;
}
