import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateVendorProductPriceDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}
