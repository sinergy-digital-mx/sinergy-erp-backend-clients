import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePurchaseOrderPedimentoDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Número de pedimento aduanal (Anexo 22, 15 dígitos: año, aduana, patente y numeración). Se guarda como 26  47  3807  6000123. Solo proveedor internacional. Null o vacío para borrar.',
    example: '26  47  3807  6000123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  pedimento_number?: string | null;
}
