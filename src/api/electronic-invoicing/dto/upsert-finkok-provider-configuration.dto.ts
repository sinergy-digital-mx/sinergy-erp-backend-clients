import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpsertFinkokProviderConfigurationDto {
  @IsNotEmpty({ message: 'El ambiente es obligatorio' })
  @IsEnum(['demo', 'production'], {
    message: 'El ambiente debe ser demo o production',
  })
  environment: 'demo' | 'production';

  @IsNotEmpty({ message: 'El usuario de Finkok es obligatorio' })
  @IsString()
  @MaxLength(255)
  finkok_username: string;

  @IsNotEmpty({ message: 'La contraseña de Finkok es obligatoria' })
  @IsString()
  finkok_password: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  is_active?: number;

  /** Si es 1, este ambiente se usa al timbrar/cancelar por defecto */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  is_stamping_default?: number;
}
