import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class GenerateHoaPaymentsDto {
  @IsNotEmpty()
  @IsDateString()
  first_payment_date: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'El monto mensual debe ser mayor a 0' })
  monthly_amount: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'La cantidad de pagos debe ser mayor a 0' })
  payments_count: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'El día de pago debe estar entre 1 y 31' })
  @Max(31, { message: 'El día de pago debe estar entre 1 y 31' })
  payment_day: number;
}
