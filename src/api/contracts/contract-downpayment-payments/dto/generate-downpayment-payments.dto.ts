import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DownpaymentInitialPaymentDto {
  @IsNumber()
  @Min(0.01, { message: 'El monto del pago inicial debe ser mayor a 0' })
  amount: number;

  @IsDateString()
  due_date: string;
}

/**
 * Configuración al generar cuotas de enganche (meses, fechas, meta total).
 * Los pagos manuales previos en la tabla se restan del objetivo automáticamente.
 */
export class GenerateDownpaymentPaymentsDto {
  /** Meta total de enganche pactada (ej. 15000). Obligatoria si el contrato aún no la tiene. */
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'El enganche objetivo debe ser mayor a 0' })
  down_payment_target?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Los meses de enganche deben ser al menos 1' })
  down_payment_months?: number;

  @IsOptional()
  @IsDateString()
  first_payment_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  payment_day?: number;

  /** Pagos fijos adicionales al generar (opcional). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DownpaymentInitialPaymentDto)
  initial_payments?: DownpaymentInitialPaymentDto[];
}
