import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateContractDto {
  @IsNumber()
  customer_id: number;

  @IsString()
  property_id: string;

  @IsOptional()
  @IsUUID()
  seller_id?: string;

  @IsOptional()
  @IsNumber()
  lead_id?: number;

  @IsOptional()
  @IsString()
  lead_group_id?: string;

  @IsOptional()
  @IsNumber()
  list_price?: number;

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

  /** Default USD. Si se omite, se toma la moneda del lote o USD. */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(['USD', 'MXN'])
  currency?: 'USD' | 'MXN';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
