import { IsDateString, IsOptional } from 'class-validator';

/**
 * Fecha de inicio del calendario (día, mes y año).
 * La fecha de fin se calcula con payment_months del contrato.
 */
export class GenerateContractPaymentsDto {
  /** Primer vencimiento, formato YYYY-MM-DD. Si se omite, se usa first_payment_date del contrato. */
  @IsOptional()
  @IsDateString()
  start_date?: string;
}
