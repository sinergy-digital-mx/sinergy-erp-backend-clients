import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsEnum, ValidateIf, IsDateString, IsString, MaxLength } from 'class-validator';
import { AccountingReportPeriod } from './query-accounting-base.dto';

export class QueryAverageCostReportDto {
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsEnum(AccountingReportPeriod)
  period?: AccountingReportPeriod = AccountingReportPeriod.MONTH;

  @ValidateIf((dto) => dto.period === AccountingReportPeriod.RANGE)
  @IsDateString()
  date_from?: string;

  @ValidateIf((dto) => dto.period === AccountingReportPeriod.RANGE)
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

