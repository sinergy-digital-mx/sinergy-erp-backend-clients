import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GlobalDiscountType } from '../../../entities/global-discounts/global-discount.entity';

export class CreateGlobalDiscountDto {
  @ApiProperty({ example: 'Descuento de carpintero' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: GlobalDiscountType, example: GlobalDiscountType.PERCENTAGE })
  @IsEnum(GlobalDiscountType)
  discount_type: GlobalDiscountType;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  value: number;

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
