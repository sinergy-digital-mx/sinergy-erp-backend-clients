import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { VendorType } from '../../../entities/vendor/vendor-type.enum';
import { VendorBankingDto } from './vendor-banking.dto';

export class UpdateVendorDto extends VendorBankingDto {
  @IsOptional()
  @IsEnum(VendorType)
  vendor_type?: VendorType;

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

  @ValidateIf((o) => o.vendor_type === VendorType.NATIONAL)
  @IsOptional()
  @IsString()
  razon_social?: string;

  @ValidateIf((o) => o.vendor_type === VendorType.NATIONAL)
  @IsOptional()
  @IsString()
  rfc?: string;

  @ValidateIf((o) => o.vendor_type === VendorType.NATIONAL)
  @IsOptional()
  @IsEnum(['Persona Física', 'Persona Moral'])
  persona_type?: string;

  @ValidateIf((o) => o.vendor_type === VendorType.INTERNATIONAL)
  @IsOptional()
  @IsString()
  tax_id?: string;

  @ValidateIf((o) => o.vendor_type === VendorType.INTERNATIONAL)
  @IsOptional()
  @IsString()
  legal_name?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  credit_days?: number;

  @IsOptional()
  @IsString()
  credit_limit?: string;
}
