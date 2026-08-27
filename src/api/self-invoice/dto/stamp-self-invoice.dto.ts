import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StampSelfInvoiceDto {
  @ApiProperty({ example: 'ana@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '6641234567' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  phone: string;

  @ApiProperty({ example: 'SSS2410213X9' })
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i, {
    message: 'El RFC no tiene un formato válido',
  })
  fiscal_rfc: string;

  @ApiProperty({ example: 'SINERGY SW SOLUTIONS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fiscal_razon_social: string;

  @ApiPropertyOptional({ enum: ['fisica', 'moral', 'otro'] })
  @IsOptional()
  @IsIn(['fisica', 'moral', 'otro'])
  fiscal_person_type?: 'fisica' | 'moral' | 'otro';

  @ApiProperty({ example: '22040' })
  @IsString()
  @Matches(/^\d{5}$/, { message: 'El código postal debe ser de 5 dígitos' })
  fiscal_postal_code: string;

  @ApiPropertyOptional({ example: 'MEX' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/i, { message: 'El país debe ser clave SAT de 3 letras' })
  fiscal_country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fiscal_street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  fiscal_exterior_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  fiscal_interior_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fiscal_colonia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fiscal_localidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fiscal_municipio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fiscal_state?: string;

  @ApiProperty({ example: 'G03' })
  @IsString()
  @Matches(/^[A-Z0-9]{3,4}$/i)
  uso_cfdi: string;

  @ApiProperty({ example: '601' })
  @IsString()
  @Matches(/^\d{3}$/)
  regimen_fiscal_receptor: string;

  @ApiProperty({ example: '01' })
  @IsString()
  @Matches(/^\d{2}$/)
  forma_pago: string;

  @ApiPropertyOptional({ example: 'PUE' })
  @IsOptional()
  @IsIn(['PUE', 'PPD'])
  metodo_pago?: 'PUE' | 'PPD';
}
