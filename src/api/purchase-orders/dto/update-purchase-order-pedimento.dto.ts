import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePurchaseOrderPedimentoDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Número de pedimento aduanal. Solo aplica a compras de proveedor internacional. Enviar null o cadena vacía para borrar.',
    example: '162430010001234',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  pedimento_number?: string | null;
}
