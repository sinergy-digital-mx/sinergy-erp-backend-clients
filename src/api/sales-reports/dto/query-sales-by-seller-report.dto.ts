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

  /**
   * Override opcional. Si no se envía, usa la comisión activa del tenant
   * (`GET /tenant/goals/settings` → commission_rate).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commission_rate?: number;
}

/** Detalle de órdenes al click en un vendedor del reporte. */
export class QuerySalesBySellerOrdersDto extends QuerySalesBySellerReportDto {
  @IsUUID()
  seller_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}
