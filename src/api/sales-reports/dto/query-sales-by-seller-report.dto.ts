import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export enum SalesReportPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  RANGE = 'range',
}

export class QuerySalesBySellerReportDto {
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsEnum(SalesReportPeriod)
  period?: SalesReportPeriod = SalesReportPeriod.MONTH;

  @ValidateIf((dto) => dto.period === SalesReportPeriod.RANGE)
  @IsDateString()
  date_from?: string;

  @ValidateIf((dto) => dto.period === SalesReportPeriod.RANGE)
  @IsDateString()
  date_to?: string;

  /** Demo/testing only — applied to every row until per-seller rates exist. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commission_rate?: number = 0;
}
