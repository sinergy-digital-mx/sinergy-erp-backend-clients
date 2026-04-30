import { IsOptional, IsString, IsNumber, IsUUID, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPosConfigurationDto {
  @ApiPropertyOptional({ 
    description: 'Page number for pagination', 
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'Number of records per page', 
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'Search term for equipment code', 
    example: 'Computadora'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status: 1 = active, 0 = inactive', 
    example: 1,
    enum: [0, 1]
  })
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  status?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by branch UUID', 
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  sucursal?: string;

  @ApiPropertyOptional({
    description: 'Filter by equipment type',
    example: 'VENTAS',
    enum: ['VENTAS', 'COBRANZA'],
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsString()
  @IsIn(['VENTAS', 'COBRANZA'])
  type?: 'VENTAS' | 'COBRANZA';
}
