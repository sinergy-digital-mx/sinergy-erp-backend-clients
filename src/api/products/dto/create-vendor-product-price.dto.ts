import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateVendorProductPriceDto {
  @IsString()
  @IsNotEmpty()
  vendor_id: string;

  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  uom_id: string;

  @IsNumber()
  @Min(0)
  price: number;
}
