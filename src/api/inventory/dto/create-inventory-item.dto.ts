import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiPropertyOptional({ description: 'Initial quantity on hand', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity_on_hand?: number;

  @ApiPropertyOptional({ description: 'Reorder point', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_point?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_quantity?: number;

  @ApiPropertyOptional({ description: 'Physical location', example: 'A-01-03' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Valuation method',
    enum: ['FIFO', 'LIFO', 'Weighted_Average'],
    default: 'Weighted_Average',
  })
  @IsOptional()
  @IsEnum(['FIFO', 'LIFO', 'Weighted_Average'])
  valuation_method?: string;

  @ApiPropertyOptional({ description: 'Initial unit cost', example: 10.50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_cost?: number;
}
