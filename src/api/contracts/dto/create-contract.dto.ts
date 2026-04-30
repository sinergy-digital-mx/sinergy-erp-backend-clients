import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractDto {
  @IsNumber()
  customer_id: number;

  @IsString()
  property_id: string;

  @IsOptional()
  @IsUUID()
  seller_id?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  contract_number?: string;

  @IsDate()
  @Type(() => Date)
  contract_date: Date;

  @IsNumber()
  total_price: number;

  @IsNumber()
  down_payment: number;

  @IsOptional()
  @IsBoolean()
  down_payment_financed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  down_payment_months?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  down_payment_first_payment_date?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  down_payment_payment_day?: number;

  /** 0 = pago de contado (enganche cubre el total); ≥1 si hay saldo a financiar */
  @IsNumber()
  @Min(0)
  payment_months: number;

  @IsDate()
  @Type(() => Date)
  first_payment_date: Date;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
