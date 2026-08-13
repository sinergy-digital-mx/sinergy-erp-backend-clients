import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    minLength: 8,
    example: 'NuevaClave123',
  })
  @IsString({ message: 'La nueva contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  new_password: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña',
    minLength: 8,
    example: 'NuevaClave123',
  })
  @IsString({ message: 'La confirmación debe ser texto' })
  @MinLength(8, { message: 'La confirmación debe tener al menos 8 caracteres' })
  confirm_password: string;
}
