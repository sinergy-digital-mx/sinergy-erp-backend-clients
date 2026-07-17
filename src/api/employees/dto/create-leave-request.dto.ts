import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LeaveType } from '../../../entities/employees/leave-type.enum';

/**
 * Crea una solicitud de vacaciones/falta/permiso/incapacidad.
 * Se reutiliza en el módulo Empleados (a nombre de un empleado) y en el Portal
 * (a nombre del empleado autenticado).
 */
export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, description: 'Tipo de solicitud' })
  @IsEnum(LeaveType, {
    message: 'El tipo debe ser vacation, absence, permission o sick_leave',
  })
  type: LeaveType;

  @ApiProperty({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsISO8601({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  start_date: string;

  @ApiProperty({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsISO8601({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' })
  end_date: string;

  @ApiProperty({ required: false, description: 'Motivo / comentarios' })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  reason?: string;

  @ApiProperty({
    required: false,
    description: 'Indica si la ausencia es con goce de sueldo (default true)',
  })
  @IsOptional()
  @IsBoolean({ message: 'is_paid debe ser verdadero o falso' })
  is_paid?: boolean;
}
