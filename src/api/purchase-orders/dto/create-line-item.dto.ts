import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateLineItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  iva_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ieps_percentage?: number;
}
