import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryInventoryTransferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  source_warehouse_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destination_warehouse_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  source_billing_branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destination_billing_branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  created_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  created_to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ default: 'DESC' })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}
