import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryPropertiesDto {
  @ApiPropertyOptional({
    description: 'Grupo de cliente (UUID). Mismo catálogo que Clientes/Contratos.',
  })
  @IsOptional()
  @IsString()
  group_id?: string;

  @ApiPropertyOptional({
    description: 'Alias de group_id (compat). Preferir group_id.',
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({
    description: 'Alias de group_id (compat). Preferir group_id.',
  })
  @IsOptional()
  @IsString()
  customer_group_id?: string;

  @ApiPropertyOptional({ description: 'Buscar código, manzana, clave catastral, nombre o cliente' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estatus del lote' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
