import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { SalesOrderSaleScope } from '../../../entities/sales-orders/sales-order-sale-scope.enum';

export class QuerySalesOrderProductsSummaryDto {
  @IsUUID()
  fiscal_configuration_id: string;

  @IsUUID()
  billing_branch_id: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 40;

  @IsOptional()
  @IsEnum(SalesOrderSaleScope)
  sale_scope?: SalesOrderSaleScope;
}
