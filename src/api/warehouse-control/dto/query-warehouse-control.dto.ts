import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryWarehouseControlDto {
  @IsOptional()
  @IsString()
  search?: string;

  /** CEDIS / sucursal fiscal (warehouses.billing_branch_id) */
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

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
}
