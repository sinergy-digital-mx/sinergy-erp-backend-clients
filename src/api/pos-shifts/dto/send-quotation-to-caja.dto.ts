import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateQuotationLineItemDto } from '../../quotations/dto/create-quotation.dto';

export class SendQuotationToCajaDto {
  @ApiProperty({
    required: false,
    description:
      'Si viene, reemplaza los productos de la cotización antes de reenviar.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'La cotización debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationLineItemDto)
  line_items?: CreateQuotationLineItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsUUID()
  global_discount_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiProperty({
    required: false,
    description:
      'Anticipo con IVA a cobrar. Si se omite, se conserva el monto regresado.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  advance_amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  advance_uso_cfdi?: string;

  @IsOptional()
  @IsIn(['PUE', 'PPD'])
  advance_metodo_pago?: 'PUE' | 'PPD';
}
