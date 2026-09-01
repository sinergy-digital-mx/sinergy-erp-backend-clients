import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * RH corrige fechas o días de una solicitud (p. ej. 9 naturales → 7 hábiles).
 */
export class UpdateLeaveRequestDto {
  @ApiProperty({ required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  start_date?: string;

  @ApiProperty({ required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' })
  end_date?: string;

  @ApiProperty({
    required: false,
    description: 'Días a descontar. Si se omite y cambian fechas, se recalcula.',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Los días deben ser un número' })
  @Min(0.5, { message: 'Los días deben ser al menos 0.5' })
  days?: number;

  @ApiProperty({
    required: false,
    description: 'Si es true, el recálculo incluye sábados y domingo.',
  })
  @IsOptional()
  @IsBoolean({ message: 'count_weekends debe ser verdadero o falso' })
  count_weekends?: boolean;

  @ApiProperty({ required: false, description: 'Motivo / comentarios' })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean({ message: 'is_paid debe ser verdadero o falso' })
  is_paid?: boolean;
}
