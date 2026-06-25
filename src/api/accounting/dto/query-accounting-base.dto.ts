import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export enum AccountingReportPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  RANGE = 'range',
}

export class QueryAccountingBaseDto {
  @IsUUID()
  billing_branch_id: string;

  @IsOptional()
  @IsEnum(AccountingReportPeriod)
  period?: AccountingReportPeriod = AccountingReportPeriod.MONTH;

  @ValidateIf((dto) => dto.period === AccountingReportPeriod.RANGE)
  @IsDateString()
  date_from?: string;

  @ValidateIf((dto) => dto.period === AccountingReportPeriod.RANGE)
  @IsDateString()
  date_to?: string;
}

export class QueryAccountsPayableDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  search?: string;
}

export class QueryAccountsReceivableDto {
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  search?: string;
}

export class QueryPosTerminalSalesDto extends QueryAccountingBaseDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
