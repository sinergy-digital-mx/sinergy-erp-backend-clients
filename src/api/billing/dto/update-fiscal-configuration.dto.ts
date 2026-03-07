import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateFiscalConfigurationDto {
  @IsOptional()
  @IsString()
  razon_social?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'RFC must be in valid format (13 characters: 3-4 letters + 6 digits + 3 alphanumeric)',
  })
  rfc?: string;

  @IsOptional()
  @IsString()
  persona_type?: string;

  @IsOptional()
  @IsString()
  fiscal_regime?: string;

  @IsOptional()
  @IsString()
  digital_seal?: string;

  @IsOptional()
  @IsString()
  digital_seal_password?: string;

  @IsOptional()
  @IsString()
  private_key?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
