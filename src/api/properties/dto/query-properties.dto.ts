import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryPropertiesDto {
  @ApiPropertyOptional({
    description: 'Filtrar por proyecto (property group UUID). groupId, no group_id.',
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por grupo de cliente (UUID). Lotes con al menos un contrato de ese grupo.',
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
