import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PartialShiftDenominationDto {
  @ApiProperty({ enum: ['MXN', 'USD'] })
  @IsEnum(['MXN', 'USD'])
  currency: 'MXN' | 'USD';

  @ApiProperty({ example: 50, description: 'Valor de la pieza, incluyendo centavos (0.50, 0.20, 0.10, 0.05, 0.01)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  denomination: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  bill_count: number;
}

export class CreatePartialShiftDto {
  @ApiProperty({ type: [PartialShiftDenominationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartialShiftDenominationDto)
  denominations: PartialShiftDenominationDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description: 'Vendedor que realiza el corte parcial (si no se envía, usa el terminal)',
  })
  @IsOptional()
  @IsString()
  performed_by_user_id?: string;
}
