import { IsString, IsNumber, IsDate, IsOptional, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsString()
  contract_id: string;

  @IsString()
  @Length(1, 50)
  payment_number: string;

  @IsDate()
  @Type(() => Date)
  payment_date: Date;

  @IsNumber()
  amount_paid: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  payment_method?: string;

  @IsOptional()
  @IsEnum(['pagado', 'pendiente', 'atrasado', 'cancelado'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
