import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCustomerProductInsightsDto {
  @ApiPropertyOptional({
    default: 8,
    description: 'Máximo de productos en “más comprados” (1–20)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  most_purchased_limit?: number = 8;

  @ApiPropertyOptional({
    default: 8,
    description: 'Máximo de productos en “pueden interesar” (1–20)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  recommended_limit?: number = 8;
}
