import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShippingOrderItemDto {
  @IsUUID()
  sales_order_id: string;

  @IsInt()
  @Min(1)
  stop_sequence: number;

  @IsOptional()
  @IsInt()
  customer_address_id?: number;
}

export class CreateShippingDto {
  @IsDateString()
  shipping_date: string;

  @IsUUID()
  driver_id: string;

  @IsUUID()
  truck_id: string;

  @IsUUID()
  origin_warehouse_id: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingOrderItemDto)
  orders: ShippingOrderItemDto[];
}

export class PreviewShippingDto {
  @IsUUID()
  origin_warehouse_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingOrderItemDto)
  orders: ShippingOrderItemDto[];
}

export class AddShippingStopsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingOrderItemDto)
  orders: ShippingOrderItemDto[];
}

export class UpdateShippingStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;
}

export class ResolveOrdersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  sales_order_ids: string[];
}

export class QueryShippingDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @IsOptional()
  @IsUUID()
  truck_id?: string;

  @IsOptional()
  @IsUUID()
  origin_warehouse_id?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}
