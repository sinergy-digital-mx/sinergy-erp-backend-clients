import { IsUUID, IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopProductsQueryDto {
  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiProperty({ description: 'Date from (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  date_from: string;

  @ApiProperty({ description: 'Date to (ISO 8601)', example: '2024-01-31' })
  @IsDateString()
  date_to: string;

  @ApiPropertyOptional({ description: 'Number of top products to return', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
