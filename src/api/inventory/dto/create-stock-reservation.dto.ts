import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockReservationDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsString()
  product_id: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsString()
  warehouse_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsString()
  uom_id: string;

  @ApiProperty({ description: 'Quantity to reserve', example: 10 })
  @IsNumber()
  @Min(0.0001)
  quantity_reserved: number;

  @ApiProperty({ description: 'Reference type', example: 'sales_order' })
  @IsString()
  reference_type: string;

  @ApiProperty({ description: 'Reference ID', example: 'uuid' })
  @IsString()
  reference_id: string;

  @ApiPropertyOptional({ description: 'Expiration date', example: '2024-03-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
