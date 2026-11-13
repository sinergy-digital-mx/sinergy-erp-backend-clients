import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID } from 'class-validator';

export const STOCK_PERIOD_DAY_OPTIONS = [30, 60, 90] as const;
export const STOCK_COVER_DAY_OPTIONS = [15, 30, 45, 60] as const;

export class QueryStockReplenishmentDto {
  @IsUUID()
  vendor_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(STOCK_PERIOD_DAY_OPTIONS)
  period_days?: (typeof STOCK_PERIOD_DAY_OPTIONS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(STOCK_COVER_DAY_OPTIONS)
  cover_days?: (typeof STOCK_COVER_DAY_OPTIONS)[number];
}
