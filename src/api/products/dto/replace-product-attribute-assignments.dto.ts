import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReplaceProductAttributeAssignmentsDto {
  @ApiProperty({
    type: [String],
    description: 'IDs de valores de catálogo. Reemplaza el set completo del producto.',
    example: ['uuid-cbc', 'uuid-8ft'],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  attribute_value_ids: string[];
}
