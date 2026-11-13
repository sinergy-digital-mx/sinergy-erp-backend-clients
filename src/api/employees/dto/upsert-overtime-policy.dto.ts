import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpsertOvertimePolicyDto {
  @ApiProperty({ description: 'Horas de la jornada ordinaria. Tarifa = salario diario / jornada.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Las horas de jornada deben ser un número' })
  @Min(1, { message: 'La jornada debe ser de al menos 1 hora' })
  @Max(24, { message: 'La jornada no puede superar 24 horas' })
  workday_hours: number;

  @ApiProperty({ description: 'Primeras horas del día que se pagan al doble' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El tope diario debe ser un número' })
  @Min(0, { message: 'El tope diario no puede ser negativo' })
  @Max(24, { message: 'El tope diario no puede superar 24 horas' })
  daily_double_hours: number;

  @ApiProperty({ description: 'Primeras horas de la semana que se pagan al doble' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El tope semanal debe ser un número' })
  @Min(0, { message: 'El tope semanal no puede ser negativo' })
  @Max(168, { message: 'El tope semanal no puede superar 168 horas' })
  weekly_double_hours: number;

  @ApiProperty({ description: 'Multiplicador de las horas dentro del tope. 2 = doble.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El multiplicador doble debe ser un número' })
  @Min(1, { message: 'El multiplicador doble debe ser al menos 1' })
  @Max(10, { message: 'El multiplicador doble no puede superar 10' })
  double_multiplier: number;

  @ApiProperty({ description: 'Multiplicador del excedente. 3 = triple.' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El multiplicador del excedente debe ser un número' })
  @Min(1, { message: 'El multiplicador del excedente debe ser al menos 1' })
  @Max(10, { message: 'El multiplicador del excedente no puede superar 10' })
  excess_multiplier: number;
}
