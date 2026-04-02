import { IsOptional, IsString, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query DTO for filtering and paginating inventory batches
 * Supports filtering by batch number, product, warehouse, date range, and purchase order
 */
export class QueryInventoryBatchDto {
  @IsOptional()
  @IsString()
  batch_number?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsUUID()
  purchase_order_batch_id?: string;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sort_by?: 'batch_number' | 'created_at' | 'quantity' = 'created_at';

  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
