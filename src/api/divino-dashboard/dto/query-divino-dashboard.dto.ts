import {
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export type DivinoDashboardScope = 'period' | 'all_time';

export class QueryDivinoDashboardDto {
  /** `period` (default) = filtrar por year/month; `all_time` = histórico completo */
  @IsOptional()
  @IsIn(['period', 'all_time'])
  scope?: DivinoDashboardScope = 'period';

  @ValidateIf((o: QueryDivinoDashboardDto) => (o.scope ?? 'period') === 'period')
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @ValidateIf(
    (o: QueryDivinoDashboardDto) =>
      (o.scope ?? 'period') === 'period' && o.month != null,
  )
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
