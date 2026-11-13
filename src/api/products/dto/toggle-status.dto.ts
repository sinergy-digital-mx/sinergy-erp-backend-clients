import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ToggleStatusDto {
  @ApiProperty({ example: false, description: 'Estado activo/inactivo' })
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'Confirma la baja del inventario al deshabilitar el producto',
  })
  @IsOptional()
  @IsBoolean()
  write_off_inventory?: boolean;
}
