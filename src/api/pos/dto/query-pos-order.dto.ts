import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPOSOrderDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Warehouse ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @ApiPropertyOptional({
    description: 'Order status (can be comma-separated for multiple statuses)',
    enum: ['pending', 'in_progress', 'ready', 'paid', 'cancelled'],
    example: 'pending,ready',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Waiter ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  waiter_id?: string;

  @ApiPropertyOptional({ description: 'Cashier ID', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  cashier_id?: string;

  @ApiPropertyOptional({ description: 'Table number', example: '5' })
  @IsOptional()
  @IsString()
  table_number?: string;

  @ApiPropertyOptional({ description: 'Zone', example: 'Terraza' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ description: 'Date from (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Date to (ISO 8601)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
