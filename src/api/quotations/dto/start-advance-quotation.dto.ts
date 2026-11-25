import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class StartAdvanceQuotationDto {
  @ApiProperty({ description: 'Monto del anticipo, con IVA.' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  advance_amount: number;

  @ApiProperty({ enum: ['unknown', 'products'] })
  @IsIn(['unknown', 'products'])
  advance_case: 'unknown' | 'products';

  @ApiPropertyOptional({ description: 'IVA cuando el caso es unknown: 0, 8 o 16.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsIn([0, 8, 16])
  advance_iva_percentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4)
  advance_uso_cfdi?: string;

  @ApiPropertyOptional({ enum: ['PUE', 'PPD'] })
  @IsOptional()
  @IsIn(['PUE', 'PPD'])
  advance_metodo_pago?: 'PUE' | 'PPD';
}
