import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryMovementDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({
    description: 'Movement type',
    enum: [
      'purchase_receipt',
      'sales_shipment',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'initial_balance',
      'return_to_vendor',
      'return_from_customer',
    ],
  })
  @IsEnum([
    'purchase_receipt',
    'sales_shipment',
    'adjustment',
    'transfer_in',
    'transfer_out',
    'initial_balance',
    'return_to_vendor',
    'return_from_customer',
  ])
  movement_type: string;

  @ApiProperty({ description: 'Quantity (positive for increase, negative for decrease)', example: 50 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit cost at time of movement', example: 10.50 })
  @IsNumber()
  unit_cost: number;

  @ApiPropertyOptional({ description: 'Reference type', example: 'purchase_order' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference ID', example: 'uuid' })
  @IsOptional()
  @IsString()
  reference_id?: string;

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

  @ApiPropertyOptional({ description: 'Notes', example: 'Physical count adjustment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Movement date', example: '2024-03-08T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  movement_date?: string;
}
