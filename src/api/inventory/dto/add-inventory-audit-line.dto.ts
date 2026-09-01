import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddInventoryAuditLineDto {
  @ApiProperty({ description: 'Lote a agregar al conteo (mismo almacén)' })
  @IsUUID()
  inventory_batch_id: string;
}
