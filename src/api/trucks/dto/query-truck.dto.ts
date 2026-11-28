import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTruckDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  /** Ids de sucursal separados por coma. Vacío lista toda la flota. */
  @IsOptional()
  @IsString()
  billing_branch_ids?: string;

  /** `1` = solo unidades con esa sucursal. Sin esto, también entran las que no tienen sucursal. */
  @IsOptional()
  @IsString()
  assigned_only?: string;
}
