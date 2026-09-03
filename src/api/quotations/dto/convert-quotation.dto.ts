import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConvertQuotationDto {
  @ApiProperty({
    required: false,
    description:
      'Cliente de la OV. Si se omite se usa el de la cotización. Útil para cambiar el mostrador POS por un cliente real al convertir.',
  })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @ApiProperty({
    required: false,
    description: 'Notas extra que se concatenan a las de la cotización en la OV.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
