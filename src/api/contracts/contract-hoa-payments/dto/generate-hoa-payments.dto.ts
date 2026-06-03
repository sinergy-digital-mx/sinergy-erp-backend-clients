import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class GenerateHoaPaymentsDto {
  /** Formato nuevo (preferido) */
  @IsOptional()
  @IsDateString()
  first_payment_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La cantidad de pagos debe ser mayor a 0' })
  payments_count?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El día de pago debe estar entre 1 y 31' })
  @Max(31, { message: 'El día de pago debe estar entre 1 y 31' })
  payment_day?: number;

  /** Formato legacy del frontend (rango de fechas) */
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'El monto mensual debe ser mayor a 0' })
  monthly_amount: number;
}
