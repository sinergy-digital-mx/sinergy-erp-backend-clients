import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductDiscountType } from '../../../entities/products/product-discount.entity';

export class CreateProductDiscountDto {
  @ApiProperty({ example: 'Promo mostrador' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: ProductDiscountType, example: ProductDiscountType.PERCENTAGE })
  @IsEnum(ProductDiscountType)
  discount_type: ProductDiscountType;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  value: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  product_uom_id?: string | null;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  valid_from?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  valid_to?: string | null;
}
