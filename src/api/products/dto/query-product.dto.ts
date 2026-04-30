import { IsOptional, IsString, IsInt, Min, IsUUID, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryProductDto {
  @ApiPropertyOptional({ example: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Registros por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'PROD', description: 'Buscar por SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'EXT-ERP', description: 'Buscar por SKU externo' })
  @IsOptional()
  @IsString()
  external_sku?: string;

  @ApiPropertyOptional({ example: 'Producto', description: 'Buscar por nombre' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-category', description: 'Filtrar por categoría' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'uuid-subcategory', description: 'Filtrar por subcategoría' })
  @IsOptional()
  @IsUUID()
  subcategory_id?: string;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por estado activo/inactivo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active?: boolean;
}
