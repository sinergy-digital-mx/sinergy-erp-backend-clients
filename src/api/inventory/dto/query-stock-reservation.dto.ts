import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryStockReservationDto {
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

  @ApiPropertyOptional({
    description: 'Reservation status filter',
    enum: ['active', 'fulfilled', 'cancelled', 'expired'],
  })
  @IsOptional()
  @IsEnum(['active', 'fulfilled', 'cancelled', 'expired'])
  status?: string;

  @ApiPropertyOptional({ description: 'Reference type filter', example: 'sales_order' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  reference_id?: string;
}
