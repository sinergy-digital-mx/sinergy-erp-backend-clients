import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLineItemDto {
  @ApiPropertyOptional({ description: 'Quantity', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number;

  @ApiPropertyOptional({ description: 'Special instructions', example: 'Extra picante' })
  @IsOptional()
  @IsString()
  notes?: string;
}
