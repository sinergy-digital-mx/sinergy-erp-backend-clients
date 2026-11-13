import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateSalesOrderLineItemDto } from '../../sales-orders/dto/create-sales-order.dto';

export class ReplacePosSaleCartDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'La orden debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineItemDto)
  line_items: CreateSalesOrderLineItemDto[];

  @ApiProperty({
    required: false,
    description: 'Cliente. Si se omite se usa mostrador.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customer_id?: number;

  @ApiProperty({
    required: false,
    description: 'Descuento global. Si se omite se quita.',
  })
  @IsOptional()
  @IsUUID()
  global_discount_id?: string;

  @ApiProperty({ required: false, description: 'Nombre para el ticket (mostrador)' })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  walk_in_name?: string;

  @ApiProperty({ required: false, description: 'RFC para el ticket (mostrador)' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]/g, '') || undefined : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'El RFC debe tener 12 o 13 caracteres',
  })
  walk_in_rfc?: string;

  @ApiProperty({
    required: false,
    description: 'Marca la orden para envío al reenviar el ticket a caja.',
  })
  @IsOptional()
  @IsBoolean()
  for_shipping?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Observaciones de la venta. Salen en el ticket. Vacío las borra. Si se omite, se conservan.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
