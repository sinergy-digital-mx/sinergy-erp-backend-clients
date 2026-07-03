import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSalesOrderNotesDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Notas internas de la orden. Enviar null o cadena vacía para borrar.',
    example: 'Cliente pidió factura posteriormente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
