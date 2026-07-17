import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Cambios que el propio empleado puede hacer sobre su cuenta desde el portal:
 * nombre, teléfono y contraseña.
 */
export class UpdateMyProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: 'Nueva contraseña (mínimo 8 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
