import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryPosFolioQuotationsDto {
  @ApiPropertyOptional({ description: 'Sucursal de la sesión POS' })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiPropertyOptional({ description: 'Razón social de la sesión POS' })
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Solo cotizaciones con anticipo' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  has_advance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
