import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateDownpaymentPaymentDto {
  /** Monto total esperado de la cuota (editable). */
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount?: number;

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
