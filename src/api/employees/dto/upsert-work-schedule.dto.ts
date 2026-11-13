import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class WorkScheduleDayDto {
  @ApiProperty({ description: 'Día ISO: 1 lunes … 7 domingo' })
  @IsInt({ message: 'El día de la semana debe ser un número' })
  @Min(1, { message: 'El día de la semana no es válido' })
  @Max(7, { message: 'El día de la semana no es válido' })
  weekday: number;

  @ApiProperty({ description: 'true si trabaja ese día' })
  @IsBoolean({ message: 'Indica si el día es laboral' })
  is_workday: boolean;

  @ApiProperty({ required: false, example: '09:00' })
  @ValidateIf((_, value) => value != null && value !== '')
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'La hora de entrada debe ser HH:mm',
  })
  start_time?: string | null;

  @ApiProperty({ required: false, example: '18:00' })
  @ValidateIf((_, value) => value != null && value !== '')
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'La hora de salida debe ser HH:mm',
  })
  end_time?: string | null;
}

export class UpsertWorkScheduleDto {
  @ApiProperty({ type: [WorkScheduleDayDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Envía los días del horario' })
  @ValidateNested({ each: true })
  @Type(() => WorkScheduleDayDto)
  days: WorkScheduleDayDto[];

  @ApiProperty({ required: false, maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @MaxLength(255, { message: 'Las notas del horario admiten máximo 255 caracteres' })
  notes?: string | null;
}
