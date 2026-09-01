import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignUserWarehousesDto {
  @ApiProperty({
    type: [String],
    description:
      'Almacenes de Mesa de Control. Deben pertenecer a la sucursal del usuario si tiene una asignada.',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  warehouse_ids: string[];
}
