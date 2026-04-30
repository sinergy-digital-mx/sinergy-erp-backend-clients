import {
  IsBoolean,
  IsDate,
  IsEnum,
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

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  contract_number?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contract_date?: Date;

  @IsOptional()
  @IsNumber()
  total_price?: number;

  @IsOptional()
  @IsNumber()
  down_payment?: number;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  payment_months?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  first_payment_date?: Date;

  @IsOptional()
  @IsUUID()
  seller_id?: string;

  @IsOptional()
  @IsEnum(['activo', 'completado', 'cancelado', 'suspendido'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
