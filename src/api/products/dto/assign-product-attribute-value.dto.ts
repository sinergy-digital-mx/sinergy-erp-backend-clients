import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignProductAttributeValueDto {
  @ApiProperty({ description: 'ID del valor de catálogo a asignar al producto' })
  @IsUUID()
  attribute_value_id: string;
}
