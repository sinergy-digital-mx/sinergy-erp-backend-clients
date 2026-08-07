import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeaveStatus } from '../../../entities/employees/leave-status.enum';

/**
 * Aprueba o rechaza una solicitud de vacaciones/falta.
 */
export class ReviewLeaveRequestDto {
  @ApiProperty({
    enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED],
    description: 'Resolución de la solicitud',
  })
  @IsEnum(LeaveStatus, {
    message: 'El estatus debe ser approved o rejected',
  })
  status: LeaveStatus;

  @ApiProperty({ required: false, description: 'Notas de la resolución' })
  @IsOptional()
  @IsString({ message: 'Las notas de revisión deben ser texto' })
  @MaxLength(500, {
    message: 'Las notas de revisión no pueden superar 500 caracteres',
  })
  review_notes?: string;
}
