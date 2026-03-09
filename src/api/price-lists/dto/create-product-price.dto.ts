import { IsString, IsNumber, IsOptional, IsBoolean, IsDateString, IsObject, Min, Max } from 'class-validator';

export class CreateProductPriceDto {
  @IsString()
  product_id: string;

  @IsString()
  price_list_id: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @IsOptional()
  @IsDateString()
  valid_from?: string;

  @IsOptional()
  @IsDateString()
  valid_to?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
