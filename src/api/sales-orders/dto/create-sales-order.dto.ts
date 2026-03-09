import { IsString, IsOptional, IsEnum, IsObject, IsUUID, IsDateString, IsArray, ValidateNested, ArrayMinSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSalesOrderLineDto } from './create-sales-order-line.dto';

export class CreateSalesOrderDto {
  @ApiPropertyOptional({
    description: 'Customer ID (optional)',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @ApiProperty({
    description: 'Warehouse ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  warehouse_id: string;

  @ApiProperty({
    description: 'Name of the sales order',
    example: 'Order #12345',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the sales order',
    example: 'Monthly subscription renewal',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Delivery date (ISO 8601 format)',
    example: '2026-03-15',
  })
  @IsOptional()
  @IsDateString()
  delivery_date?: string;

  @ApiPropertyOptional({
    description: 'Status of the sales order',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'processing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { customer_notes: 'Urgent delivery', priority: 'high' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Line items (products) for the sales order',
    type: [CreateSalesOrderLineDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  @ArrayMinSize(0)
  line_items?: CreateSalesOrderLineDto[];
}
