import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDivinoDashboardDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;
}

export class QueryRevenueSeriesDto extends QueryDivinoDashboardDto {
  @IsOptional()
  period?: 'monthly' | 'quarterly' | 'semiannual' | 'annual' = 'monthly';
}
