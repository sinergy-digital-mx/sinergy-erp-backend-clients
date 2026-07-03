import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePurchaseOrderNotesDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Notas internas de la orden. Enviar null o cadena vacía para borrar.',
    example: 'Proveedor confirmó entrega el viernes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
