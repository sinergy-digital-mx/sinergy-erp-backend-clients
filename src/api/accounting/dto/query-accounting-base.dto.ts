import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

export enum AccountsPayableCurrencyView {
  ALL = 'all',
  MXN = 'mxn',
  USD = 'usd',
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

  @IsOptional()
  @IsEnum(AccountsPayableCurrencyView)
  currency?: AccountsPayableCurrencyView = AccountsPayableCurrencyView.ALL;

  @IsOptional()
  @IsEnum(AccountingReportPeriod)
  period?: AccountingReportPeriod;

  @ValidateIf((dto) => dto.period === AccountingReportPeriod.RANGE)
  @IsDateString()
  date_from?: string;

  @ValidateIf((dto) => dto.period === AccountingReportPeriod.RANGE)
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;
}

export class QueryAccountsReceivableDto {
  @IsOptional()
  @IsUUID()
  fiscal_configuration_id?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(AccountsPayableCurrencyView)
  currency?: AccountsPayableCurrencyView = AccountsPayableCurrencyView.ALL;
}

export class QueryPosTerminalSalesDto extends QueryAccountingBaseDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

/** Filtro de cliente en detalle de órdenes cobradas (card Terminal de cobranza). */
export enum PosCollectionCustomerType {
  ALL = 'all',
  WALK_IN = 'walk_in',
  INVOICED = 'invoiced',
}

export enum PosCollectionPaymentMethodFilter {
  CASH = 'cash',
  TRANSFER = 'transfer',
  CARD = 'card',
  CHECK = 'check',
  CREDIT = 'credit',
}

export enum PosCollectionCreditScope {
  PAID = 'paid',
}

export enum PosCollectionDateBasis {
  SHIFT = 'shift',
  COLLECTED = 'collected',
}

export class QueryPosCollectionsDto extends QueryAccountingBaseDto {
  @IsOptional()
  @IsEnum(PosCollectionDateBasis)
  date_basis?: PosCollectionDateBasis = PosCollectionDateBasis.SHIFT;

  @IsOptional()
  @IsEnum(PosCollectionCustomerType)
  customer_type?: PosCollectionCustomerType = PosCollectionCustomerType.ALL;

  @IsOptional()
  @IsEnum(PosCollectionPaymentMethodFilter)
  payment_method?: PosCollectionPaymentMethodFilter;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  credit_only?: boolean;

  @IsOptional()
  @IsEnum(PosCollectionCreditScope)
  credit_scope?: PosCollectionCreditScope;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  for_shipping?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
