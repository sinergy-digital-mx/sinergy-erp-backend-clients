import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
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
}
