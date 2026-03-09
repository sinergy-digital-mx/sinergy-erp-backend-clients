import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ description: 'Reorder point', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_point?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_quantity?: number;

  @ApiPropertyOptional({ description: 'Physical location', example: 'A-01-03' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Valuation method',
    enum: ['FIFO', 'LIFO', 'Weighted_Average'],
  })
  @IsOptional()
  @IsEnum(['FIFO', 'LIFO', 'Weighted_Average'])
  valuation_method?: string;
}
