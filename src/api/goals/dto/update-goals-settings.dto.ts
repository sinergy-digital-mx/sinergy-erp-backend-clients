import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateGoalsSettingsDto {
  @ApiProperty({
    example: 1,
    description: 'Comisión activa en % sobre el monto vendido (ej. 1 = 1%)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate: number;
}
