import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddLineItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'Unit of Measure ID', example: 'uuid' })
  @IsUUID()
  uom_id: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Special instructions', example: 'Sin cebolla' })
  @IsOptional()
  @IsString()
  notes?: string;
}
