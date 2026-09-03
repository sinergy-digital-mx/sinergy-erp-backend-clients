import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialShiftDenominationDto } from './create-partial-shift.dto';

export class CloseDailyShiftDto {
  @ApiProperty({
    example: 605.59,
    description: 'Efectivo MXN contado en caja al cerrar',
  })
  @IsNumber()
  @Min(0)
  closing_cash_mxn: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  closing_cash_usd?: number;

  @ApiProperty({
    required: false,
    type: [PartialShiftDenominationDto],
    description: 'Desglose de billetes, monedas y centavos contados en caja (opcional)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartialShiftDenominationDto)
  denominations?: PartialShiftDenominationDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
