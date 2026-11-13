import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class CreateOvertimeRequestDto {
  @ApiProperty({ description: 'Fecha en que se realizaron las horas (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  work_date: string;

  @ApiProperty({ example: '18:00', description: 'Hora de inicio (HH:mm)' })
  @Matches(CLOCK, { message: 'La hora de inicio debe tener formato HH:mm' })
  start_time: string;

  @ApiProperty({ example: '21:00', description: 'Hora de término (HH:mm)' })
  @Matches(CLOCK, { message: 'La hora de término debe tener formato HH:mm' })
  end_time: string;

  @ApiProperty({ description: 'Motivo de las horas extras' })
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  reason: string;

  @ApiProperty({ required: false, description: 'Observaciones adicionales' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, {
    message: 'Las observaciones no pueden superar 500 caracteres',
  })
  notes?: string;
}
