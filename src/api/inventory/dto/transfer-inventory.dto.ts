import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferInventoryDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Source warehouse ID', example: 'uuid' })
  @IsString()
  source_warehouse_id: string;

  @ApiProperty({ description: 'Destination warehouse ID', example: 'uuid' })
  @IsString()
  destination_warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 50 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiProperty({ description: 'Unit cost', example: 10.50 })
  @IsNumber()
  @Min(0)
  unit_cost: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Transfer for restock' })
  @IsOptional()
  @IsString()
  notes?: string;
}
