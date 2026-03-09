import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInventoryMovementDto {
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
    description: 'Movement type filter',
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
  @IsOptional()
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
  movement_type?: string;

  @ApiPropertyOptional({ description: 'Movement date from', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  movement_date_from?: string;

  @ApiPropertyOptional({ description: 'Movement date to', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  movement_date_to?: string;

  @ApiPropertyOptional({ description: 'Reference type filter', example: 'sales_order' })
  @IsOptional()
  @IsString()
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference ID filter', example: 'uuid' })
  @IsOptional()
  @IsString()
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Lot number filter', example: 'LOT-2024-001' })
  @IsOptional()
  @IsString()
  lot_number?: string;

  @ApiPropertyOptional({ description: 'Serial number filter', example: 'SN-123456' })
  @IsOptional()
  @IsString()
  serial_number?: string;
}
