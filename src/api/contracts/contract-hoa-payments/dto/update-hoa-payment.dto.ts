import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateHoaPaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El monto pagado no puede ser negativo' })
  amount_paid?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsDateString()
  paid_date?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
