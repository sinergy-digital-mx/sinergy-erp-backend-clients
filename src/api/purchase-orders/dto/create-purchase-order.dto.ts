import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLineItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  uom_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_total: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_unit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ieps_unit?: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  fiscal_configuration_id: string;

  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @IsUUID()
  @IsNotEmpty()
  vendor_id: string;

  @IsDateString()
  @IsNotEmpty()
  expected_delivery_date: string;

  @IsEnum(['Pendiente', 'Pagado'])
  @IsOptional()
  payment_status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  line_items: CreateLineItemDto[];
}
