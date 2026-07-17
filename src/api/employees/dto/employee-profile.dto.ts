import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { EmployeeStatus } from '../../../entities/employees/employee-status.enum';
import { EmployeePaymentFrequency } from '../../../entities/employees/employee-payment-frequency.enum';

/**
 * Datos de RH/nómina del empleado. Se reutiliza tanto en el modal de usuario
 * (tab "Empleado") como en el módulo Empleados.
 */
export class EmployeeProfileDto {
  @ApiProperty({ required: false, description: 'Código interno de empleado' })
  @IsOptional()
  @IsString()
  employee_code?: string;

  @ApiProperty({ required: false, description: 'RFC (13 caracteres)' })
  @IsOptional()
  @IsString()
  @Length(12, 13)
  rfc?: string;

  @ApiProperty({ required: false, description: 'CURP (18 caracteres)' })
  @IsOptional()
  @IsString()
  @Length(18, 18)
  curp?: string;

  @ApiProperty({ required: false, description: 'Número de Seguridad Social (IMSS)' })
  @IsOptional()
  @IsString()
  nss?: string;

  @ApiProperty({ required: false, description: 'Puesto' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ required: false, description: 'Área / departamento' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    required: false,
    description: 'Fecha de ingreso (YYYY-MM-DD). Base para antigüedad y vacaciones.',
  })
  @IsOptional()
  @IsISO8601()
  hire_date?: string;

  @ApiProperty({ required: false, description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  birth_date?: string;

  @ApiProperty({ required: false, description: 'Sueldo mensual bruto' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_salary?: number;

  @ApiProperty({
    required: false,
    enum: EmployeePaymentFrequency,
    description: 'Periodicidad de pago',
  })
  @IsOptional()
  @IsEnum(EmployeePaymentFrequency)
  payment_frequency?: EmployeePaymentFrequency;

  @ApiProperty({ required: false, description: 'Banco' })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiProperty({ required: false, description: 'CLABE interbancaria (18 dígitos)' })
  @IsOptional()
  @IsString()
  @Length(18, 18)
  clabe?: string;

  @ApiProperty({ required: false, description: 'Número de cuenta bancaria' })
  @IsOptional()
  @IsString()
  bank_account?: string;

  @ApiProperty({ required: false, enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiProperty({ required: false, description: 'Fecha de baja (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  termination_date?: string;
}
