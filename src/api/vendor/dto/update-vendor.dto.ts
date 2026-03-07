import {
  IsString,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsOptional()
  @IsString()
  country?: string;

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
  @IsEnum(['Persona Física', 'Persona Moral'])
  persona_type?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}
