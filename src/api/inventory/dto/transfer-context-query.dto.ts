import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/** Contexto para abrir el modal de transferencia (vista totalizada o desde lote) */
export class TransferContextQueryDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;
}
