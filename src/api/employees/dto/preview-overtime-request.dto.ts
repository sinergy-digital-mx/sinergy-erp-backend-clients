import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PreviewOvertimeRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Las horas autorizadas deben ser un número' })
  @Min(0.01, { message: 'Las horas autorizadas deben ser mayores a 0' })
  @Max(24, { message: 'Las horas autorizadas no pueden superar 24' })
  approved_hours?: number;
}
