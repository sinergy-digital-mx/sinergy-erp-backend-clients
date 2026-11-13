import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceUpdatePriceDto {
  @IsUUID()
  price_list_id: string;

  @IsUUID()
  product_uom_id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdatePriceUpdateRowDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  average_cost?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => PriceUpdatePriceDto)
  prices?: PriceUpdatePriceDto[];
}
