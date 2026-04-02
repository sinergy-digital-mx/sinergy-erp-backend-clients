import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleStatusDto {
  @ApiProperty({ example: true, description: 'Estado activo/inactivo' })
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;
}
