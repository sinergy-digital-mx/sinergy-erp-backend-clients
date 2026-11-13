import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class UpdateOvertimeRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  work_date?: string;

  @ApiProperty({ required: false, example: '18:00' })
  @IsOptional()
  @Matches(CLOCK, { message: 'La hora de inicio debe tener formato HH:mm' })
  start_time?: string;

  @ApiProperty({ required: false, example: '21:00' })
  @IsOptional()
  @Matches(CLOCK, { message: 'La hora de término debe tener formato HH:mm' })
  end_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  reason?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, {
    message: 'Las observaciones no pueden superar 500 caracteres',
  })
  notes?: string | null;
}
