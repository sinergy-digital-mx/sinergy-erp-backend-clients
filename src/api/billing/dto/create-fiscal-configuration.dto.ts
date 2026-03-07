import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

export class CreateFiscalConfigurationDto {
  @IsNotEmpty()
  @IsString()
  razon_social: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'RFC must be in valid format (13 characters: 3-4 letters + 6 digits + 3 alphanumeric)',
  })
  rfc: string;

  @IsNotEmpty()
  @IsString()
  persona_type: string;

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
