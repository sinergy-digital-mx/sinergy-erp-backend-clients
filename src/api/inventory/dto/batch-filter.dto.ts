import { IsOptional, IsString, IsUUID, IsDateString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Query DTO for filtering and paginating inventory batches
 * Supports filtering by batch number, product, warehouse, purchase order, and date range
 */
export class BatchFilterDto {
  @ApiProperty({ description: 'Search by batch number, product name or product SKU', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by batch number', required: false })
  @IsOptional()
  @IsString()
  batch_number?: string;

  @ApiProperty({ description: 'Filter by product ID', required: false })
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiProperty({ description: 'Filter by warehouse ID', required: false })
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiProperty({ description: 'Filter by purchase order batch ID', required: false })
  @IsOptional()
  @IsUUID()
  purchase_order_batch_id?: string;

  @ApiProperty({ description: 'Filter by purchase order ID', required: false })
  @IsOptional()
  @IsUUID()
  purchase_order_id?: string;

  @ApiProperty({ description: 'Filter batches created from this date (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiProperty({ description: 'Filter batches created until this date (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  created_to?: string;

  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Number of records per page', required: false, default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Sort by field',
    required: false,
    default: 'created_at',
    enum: ['batch_number', 'created_at', 'quantity'],
  })
  @IsOptional()
  @IsEnum(['batch_number', 'created_at', 'quantity'])
  sort_by?: 'batch_number' | 'created_at' | 'quantity' = 'created_at';

  @ApiProperty({
    description: 'Sort order',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
