import { IsString, IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddLineItemDto } from './add-line-item.dto';

export class CreatePOSOrderDto {
  @ApiProperty({ description: 'Warehouse ID (POS location)', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiPropertyOptional({ description: 'Table number', example: '5' })
  @IsOptional()
  @IsString()
  table_number?: string;

  @ApiPropertyOptional({ description: 'Zone', example: 'Terraza' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Cliente VIP' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Line items to add to the order', 
    type: [AddLineItemDto],
    example: [{
      product_id: 'uuid',
      uom_id: 'uuid',
      quantity: 2,
      discount_percentage: 0,
      notes: 'Sin cebolla'
    }]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddLineItemDto)
  line_items?: AddLineItemDto[];
}
