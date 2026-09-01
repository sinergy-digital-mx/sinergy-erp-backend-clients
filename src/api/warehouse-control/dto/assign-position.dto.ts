import { IsOptional, IsUUID } from 'class-validator';

export class AssignPositionDto {
  /** Si se omite, se asigna la siguiente posición libre de la sucursal. */
  @IsOptional()
  @IsUUID()
  position_id?: string;
}
