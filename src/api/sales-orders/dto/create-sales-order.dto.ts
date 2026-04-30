import { Type } from 'class-transformer';
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

  @IsNumber()
  customer_id: number;

  @IsDateString()
  expected_delivery_date: string;

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  sales_order_type?: 'POS' | 'MANUAL';

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
