import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { EmployeeStatus } from '../../../entities/employees/employee-status.enum';
import { EmployeePaymentFrequency } from '../../../entities/employees/employee-payment-frequency.enum';

/** True si el valor viene vacío (null/undefined/''). */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/**
 * Datos de RH/nómina del empleado. Se reutiliza tanto en el modal de usuario
 * (tab "Empleado") como en el módulo Empleados.
 */
export class EmployeeProfileDto {
  @ApiProperty({ required: false, description: 'Código interno de empleado' })
  @IsOptional()
  @IsString({ message: 'El código de empleado debe ser texto' })
  employee_code?: string;

  @ApiProperty({ required: false, description: 'RFC (12 o 13 caracteres)' })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsString({ message: 'El RFC debe ser texto' })
  @Length(12, 13, { message: 'El RFC debe tener 12 o 13 caracteres' })
  rfc?: string;

  @ApiProperty({ required: false, description: 'CURP (18 caracteres)' })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsString({ message: 'El CURP debe ser texto' })
  @Length(18, 18, { message: 'El CURP debe tener exactamente 18 caracteres' })
  curp?: string;

  @ApiProperty({ required: false, description: 'Número de Seguridad Social (IMSS)' })
  @IsOptional()
  @IsString({ message: 'El NSS debe ser texto' })
  nss?: string;

  @ApiProperty({ required: false, description: 'Puesto' })
  @IsOptional()
  @IsString({ message: 'El puesto debe ser texto' })
  position?: string;

  @ApiProperty({ required: false, description: 'Área / departamento' })
  @IsOptional()
  @IsString({ message: 'El departamento debe ser texto' })
  department?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha de ingreso (YYYY-MM-DD). Base para antigüedad y vacaciones.',
  })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsISO8601({}, { message: 'La fecha de ingreso debe tener formato YYYY-MM-DD' })
  hire_date?: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsISO8601({}, { message: 'La fecha de nacimiento debe tener formato YYYY-MM-DD' })
  birth_date?: string;

  @ApiProperty({ required: false, description: 'Sueldo mensual bruto' })
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsNumber({}, { message: 'El sueldo mensual debe ser un número' })
  @Min(0, { message: 'El sueldo mensual no puede ser negativo' })
  monthly_salary?: number;

  @ApiProperty({
    required: false,
    enum: EmployeePaymentFrequency,
    description: 'Periodicidad de pago',
  })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsEnum(EmployeePaymentFrequency, {
    message: 'La frecuencia de pago debe ser monthly, biweekly o weekly',
  })
  payment_frequency?: EmployeePaymentFrequency;

  @ApiProperty({ required: false, description: 'Banco' })
  @IsOptional()
  @IsString({ message: 'El banco debe ser texto' })
  bank_name?: string;

  @ApiProperty({ required: false, description: 'CLABE interbancaria (18 dígitos)' })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsString({ message: 'La CLABE debe ser texto' })
  @Matches(/^\d{18}$/, { message: 'La CLABE debe tener exactamente 18 dígitos' })
  clabe?: string;

  @ApiProperty({ required: false, description: 'Número de cuenta bancaria' })
  @IsOptional()
  @IsString({ message: 'La cuenta bancaria debe ser texto' })
  bank_account?: string;

  @ApiProperty({ required: false, enum: EmployeeStatus })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsEnum(EmployeeStatus, {
    message: 'El estatus debe ser active, inactive o terminated',
  })
  status?: EmployeeStatus;

  @ApiProperty({ required: false, description: 'Fecha de baja (YYYY-MM-DD)' })
  @ValidateIf((_, value) => !isEmpty(value))
  @IsISO8601({}, { message: 'La fecha de baja debe tener formato YYYY-MM-DD' })
  termination_date?: string;

  @ApiProperty({
    required: false,
    description:
      'Días de vacaciones extra o no tomados el año anterior. RH los captura; no se calculan solos.',
  })
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsNumber({}, { message: 'Los días de arrastre deben ser un número' })
  @Min(0, { message: 'Los días de arrastre no pueden ser negativos' })
  vacation_carryover_days?: number;
}
