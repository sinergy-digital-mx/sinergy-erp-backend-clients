import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryItemDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Product ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  product_id?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @ApiPropertyOptional({ description: 'Location filter', example: 'A-01' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Search by product name or SKU', example: 'Widget' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter low stock items', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  low_stock?: boolean;
}
