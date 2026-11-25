import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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
