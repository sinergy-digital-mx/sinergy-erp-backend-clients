import { IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UpdateLineItemDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_total?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_unit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ieps_unit?: number;
}
