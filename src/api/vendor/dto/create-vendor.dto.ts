import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { VendorType } from '../../../entities/vendor/vendor-type.enum';
import { VendorBankingDto } from './vendor-banking.dto';

export class CreateVendorDto extends VendorBankingDto {
  @IsEnum(VendorType)
  vendor_type: VendorType;

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
  @ValidateIf((o) => o.vendor_type === VendorType.INTERNATIONAL)
  @IsNotEmpty({ message: 'País es requerido para proveedores internacionales' })
  country?: string;

  // Nacional (opcional, sin validación de formato)
  @ValidateIf((o) => o.vendor_type === VendorType.NATIONAL)
  @IsOptional()
  @IsString()
  rfc?: string;

  @IsOptional()
  @IsString()
  razon_social?: string;

  @ValidateIf((o) => o.vendor_type === VendorType.NATIONAL)
  @IsEnum(['Persona Física', 'Persona Moral'])
  persona_type?: string;

  // Internacional
  @ValidateIf((o) => o.vendor_type === VendorType.INTERNATIONAL)
  @IsNotEmpty({ message: 'ID fiscal es requerido para proveedores internacionales' })
  @IsString()
  tax_id?: string;

  @ValidateIf((o) => o.vendor_type === VendorType.INTERNATIONAL)
  @IsNotEmpty({ message: 'Nombre legal es requerido para proveedores internacionales' })
  @IsString()
  legal_name?: string;

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
