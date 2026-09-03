import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateQuotationLineItemDto {
  @IsUUID()
  product_id: string;

  @IsUUID()
  product_uom_id: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description:
      'Precio unitario capturado en POS o en el alta manual. Hasta 4 decimales (p. ej. 2.150). Se persiste tal cual y se reusa al convertir a OV.',
  })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number = 0;

  @ApiProperty({
    required: false,
    description:
      'Descuento de producto seleccionado en POS. Tiene prioridad sobre discount_percentage.',
  })
  @IsOptional()
  @IsUUID()
  product_discount_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  iva_percentage?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ieps_percentage?: number = 0;
}

export class CreateQuotationDto {
  @IsUUID()
  fiscal_configuration_id: string;

  @ApiProperty({
    required: false,
    description:
      'Sucursal. Obligatoria en MANUAL. En POS, si se omite se toma del almacén.',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Almacén. Obligatorio en POS. En MANUAL no se envía.',
  })
  @ValidateIf(
    (dto: CreateQuotationDto) =>
      dto.quotation_type === 'POS' || dto.warehouse_id != null,
  )
  @IsUUID()
  warehouse_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Cliente. Obligatorio en MANUAL. En POS es opcional (mostrador si se omite).',
  })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsDateString()
  expected_delivery_date: string;

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  quotation_type?: 'POS' | 'MANUAL';

  @ValidateIf((dto: CreateQuotationDto) => dto.quotation_type === 'POS')
  @IsUUID()
  @ApiProperty({
    required: false,
    description: 'Vendedor. Obligatorio en POS.',
  })
  seller_user_id?: string;

  @IsOptional()
  @IsUUID()
  assigned_seller_user_id?: string;

  @IsOptional()
  @IsString()
  fiscal_razon_social?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  global_discount_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationLineItemDto)
  line_items: CreateQuotationLineItemDto[];
}
