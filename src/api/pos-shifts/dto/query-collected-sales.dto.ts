import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class QueryCollectedSalesDto {
  @ApiProperty({
    required: false,
    description:
      'ID del corte global. Si se omite, usa el corte abierto de la sucursal de la terminal COBRANZA.',
  })
  @IsOptional()
  @IsUUID()
  daily_shift_id?: string;
}
