import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { OvertimeStatus } from '../../../entities/employees/overtime-status.enum';

export class ReviewOvertimeRequestDto {
  @ApiProperty({ enum: [OvertimeStatus.APPROVED, OvertimeStatus.REJECTED] })
  @IsIn([OvertimeStatus.APPROVED, OvertimeStatus.REJECTED], {
    message: 'El estatus debe ser approved o rejected',
  })
  status: OvertimeStatus.APPROVED | OvertimeStatus.REJECTED;

  @ApiProperty({
    required: false,
    description: 'Horas a autorizar. Si se omite, se usan las horas solicitadas.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Las horas autorizadas deben ser un número' })
  @Min(0.01, { message: 'Las horas autorizadas deben ser mayores a 0' })
  @Max(24, { message: 'Las horas autorizadas no pueden superar 24' })
  approved_hours?: number;

  @ApiProperty({ required: false, description: 'Comentarios de la decisión' })
  @IsOptional()
  @IsString({ message: 'Los comentarios deben ser texto' })
  @MaxLength(500, {
    message: 'Los comentarios no pueden superar 500 caracteres',
  })
  review_notes?: string;
}
