import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { EmployeeProfileDto } from './employee-profile.dto';

/**
 * Crea el perfil de empleado ligado a un usuario existente del sistema.
 */
export class CreateEmployeeDto extends EmployeeProfileDto {
  @ApiProperty({ description: 'ID del usuario del sistema a marcar como empleado' })
  @IsUUID()
  user_id: string;
}
