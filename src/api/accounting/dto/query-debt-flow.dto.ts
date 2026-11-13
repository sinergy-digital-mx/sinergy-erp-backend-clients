import { Type } from 'class-transformer';
import { IsUUID, IsOptional, IsInt, Min, IsString, MaxLength, IsEnum, ValidateIf, Max } from 'class-validator';

export enum DebtFlowView {
  AGING = "aging",
  LEDGER = "ledger",
}

export enum DebtFlowPeriod {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
  RANGE = "range",
}

export class QueryDebtFlowDto {
  @IsUUID()
  fiscal_configuration_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(DebtFlowView)
  view?: DebtFlowView = DebtFlowView.AGING;

  @IsOptional()
  @IsEnum(DebtFlowPeriod)
  period?: DebtFlowPeriod = DebtFlowPeriod.MONTH;

  @ValidateIf((dto) => dto.period === DebtFlowPeriod.RANGE)
  @IsString()
  date_from?: string;

  @ValidateIf((dto) => dto.period === DebtFlowPeriod.RANGE)
  @IsString()
  date_to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

