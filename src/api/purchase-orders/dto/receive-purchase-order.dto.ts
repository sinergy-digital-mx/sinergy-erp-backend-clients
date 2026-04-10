import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single received item in a purchase order receipt
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5
 */
export class ReceivedItemDto {
  @IsUUID()
  @IsNotEmpty()
  line_item_id: string;

  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  product_uom_id: string;

  @IsNumber()
  @Min(0.001)
  @Max(999999.999)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_total: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  iva_percentage: number;

  @IsNumber()
  @Min(0)
  iva_unit: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  ieps_percentage: number;

  @IsNumber()
  @Min(0)
  ieps_unit: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiration_date?: Date | null;
}

/**
 * DTO for receiving a purchase order
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 */
export class ReceivePurchaseOrderDto {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReceivedItemDto)
  received_items: ReceivedItemDto[];
}
