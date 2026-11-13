import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

  @ApiProperty({
    required: false,
    description:
      'Si true, la OV va a caja POS de la sucursal de la cotización. Si false, queda MANUAL. Si se omite, POS solo cuando la cotización era POS.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  send_to_pos_caja?: boolean;
}
