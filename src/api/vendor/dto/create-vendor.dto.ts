import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
} from 'class-validator';

export class CreateVendorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

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
  rfc?: string;

  @IsOptional()
  @IsString()
  persona_type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  credit_days?: number;

  @IsOptional()
  @IsString()
  credit_limit?: string;
}
