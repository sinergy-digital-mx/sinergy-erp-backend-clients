import { IsOptional, IsString, IsUUID, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class InventorySummaryFilterDto {
  @ApiProperty({ description: 'Search by product name or SKU', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filtrar por razón social. Requerido si se envía billing_branch_id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @ApiProperty({
    description: 'Filtrar por sucursal. Requiere fiscal_configuration_id. Requerido si se envía warehouse_id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiProperty({
    description: 'Filtrar por almacén. Requiere fiscal_configuration_id y billing_branch_id',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiProperty({ description: 'Filter by product ID', required: false })
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiProperty({ description: 'Show only products with available stock > 0', required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  only_available?: boolean = false;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ description: 'Sort by field', required: false, default: 'product_name' })
  @IsOptional()
  @IsEnum(['product_name', 'product_sku', 'total_available_quantity', 'warehouse_name'])
  sort_by?: string = 'product_name';

  @ApiProperty({ description: 'Sort order', required: false, default: 'ASC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'ASC';
}
