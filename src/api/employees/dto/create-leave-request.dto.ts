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
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsISO8601()
  start_date: string;

  @ApiProperty({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsISO8601()
  end_date: string;

  @ApiProperty({ required: false, description: 'Motivo / comentarios' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    required: false,
    description: 'Indica si la ausencia es con goce de sueldo (default true)',
  })
  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;
}
