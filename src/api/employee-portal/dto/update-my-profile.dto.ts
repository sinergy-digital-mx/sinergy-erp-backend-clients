import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

/**
 * Cambios que el propio empleado puede hacer sobre su cuenta desde el portal:
 * nombre, teléfono y contraseña.
 */
export class UpdateMyProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'El apellido debe ser texto' })
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  phone?: string;

  @ApiProperty({ required: false, description: 'Nueva contraseña (mínimo 8 caracteres)' })
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;
}
