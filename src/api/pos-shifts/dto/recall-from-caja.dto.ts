import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class RecallFromCajaDto {
  @ApiProperty({
    required: false,
    description: 'Vendedor que tiene el código abierto en POS Ventas. Su nombre sale en el aviso de caja.',
  })
  @IsOptional()
  @IsUUID()
  seller_user_id?: string;
}
