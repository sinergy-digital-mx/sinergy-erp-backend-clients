import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({ description: 'Adjustment quantity (positive for increase, negative for decrease)', example: -5 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit cost at time of adjustment', example: 10.50 })
  @IsNumber()
  unit_cost: number;

  @ApiProperty({ description: 'Reason for adjustment', example: 'Physical count adjustment - found damaged items' })
  @IsString()
  notes: string;

  @ApiPropertyOptional({ description: 'Physical location', example: 'A-01-03' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Lot number', example: 'LOT-2024-001' })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN-123456' })
  @IsOptional()
  @IsString()
  serial_number?: string;
}
