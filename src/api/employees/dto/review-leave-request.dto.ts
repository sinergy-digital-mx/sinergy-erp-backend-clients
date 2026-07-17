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
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiProperty({ required: false, description: 'Notas de la resolución' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  review_notes?: string;
}
