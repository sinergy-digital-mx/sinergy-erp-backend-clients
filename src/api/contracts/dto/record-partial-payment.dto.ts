import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';

export class RecordPartialPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number; // Monto del pago parcial

  @IsNotEmpty()
  @IsDateString()
  payment_date: string; // Fecha del pago

  @IsNotEmpty()
  @IsString()
  payment_method: string; // efectivo, transferencia, tarjeta, cheque

  @IsOptional()
  @IsString()
  reference_number?: string; // Número de referencia bancaria

  @IsOptional()
  @IsString()
  notes?: string; // Notas adicionales
}
