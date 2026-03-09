import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalesOrderDto {
  @ApiPropertyOptional({
    description: 'Name of the sales order',
    example: 'Order #12345 - Updated',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the sales order',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the sales order',
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled'],
  })
  @IsOptional()
  @IsEnum(['draft', 'confirmed', 'processing', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { updated_by: 'admin', reason: 'customer request' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
