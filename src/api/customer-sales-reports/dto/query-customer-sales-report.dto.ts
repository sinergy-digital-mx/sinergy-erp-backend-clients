import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export enum CustomerSalesReportPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  RANGE = 'range',
}

export class QueryCustomerSalesReportDto {
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsEnum(CustomerSalesReportPeriod)
  period?: CustomerSalesReportPeriod = CustomerSalesReportPeriod.MONTH;

  @ValidateIf((dto) => dto.period === CustomerSalesReportPeriod.RANGE)
  @IsDateString()
  date_from?: string;

  @ValidateIf((dto) => dto.period === CustomerSalesReportPeriod.RANGE)
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
