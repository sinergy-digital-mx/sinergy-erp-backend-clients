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

export class CreateSalesOrderLineItemDto {
  @IsUUID()
  product_id: string;

  @IsUUID()
  product_uom_id: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number = 0;

  @ApiProperty({
    required: false,
    description: 'Descuento de producto seleccionado en POS/venta. Tiene prioridad sobre discount_percentage.',
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

export class CreateSalesOrderDto {
  @IsUUID()
  fiscal_configuration_id: string;

  @IsUUID()
  warehouse_id: string;

  @ApiProperty({
    required: false,
    description:
      'Cliente. Obligatorio en órdenes MANUAL. En POS es opcional (mostrador si se omite).',
  })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsDateString()
  expected_delivery_date: string;

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  sales_order_type?: 'POS' | 'MANUAL';

  @ValidateIf((dto: CreateSalesOrderDto) => dto.sales_order_type === 'POS')
  @IsUUID()
  seller_user_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Opcional. Si no se envía, se resuelve el corte abierto de cobranza de la sucursal.',
  })
  @IsOptional()
  @IsUUID()
  pos_daily_shift_id?: string;

  @IsOptional()
  @IsString()
  fiscal_razon_social?: string;

  @IsOptional()
  @IsEnum(['Pendiente', 'Pagado'])
  payment_status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineItemDto)
  line_items: CreateSalesOrderLineItemDto[];
}
