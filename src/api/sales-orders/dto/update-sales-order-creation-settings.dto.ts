import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class UpdateSalesOrderCreationSettingsDto {
  @ApiProperty({
    description:
      'Visibilidad, obligatoriedad y valor por defecto de cada campo del alta. Cliente y razón social quedan bloqueados.',
  })
  @IsObject()
  fields: Record<string, unknown>;
}
