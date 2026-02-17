import { IsString, IsNumber, IsDate, IsOptional, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContractDto {
  @IsNumber()
  customer_id: number;

  @IsString()
  property_id: string;

  @IsString()
  @Length(1, 50)
  contract_number: string;

  @IsDate()
  @Type(() => Date)
  contract_date: Date;

  @IsNumber()
  total_price: number;

  @IsNumber()
  down_payment: number;

  @IsNumber()
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
