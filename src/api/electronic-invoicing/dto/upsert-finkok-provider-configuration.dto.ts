import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpsertFinkokProviderConfigurationDto {
  /** Tab que se está guardando (`demo` o `production`). No es el “ambiente activo para timbrar”. */
  @IsNotEmpty({ message: 'El ambiente es obligatorio' })
  @IsEnum(['demo', 'production'], {
    message: 'El ambiente debe ser demo o production',
  })
  environment: 'demo' | 'production';

  @IsNotEmpty({ message: 'El usuario de Finkok es obligatorio' })
  @IsString()
  @MaxLength(255)
  finkok_username: string;

  /**
   * Obligatoria en el alta. En edición, omitir si ya hay contraseña guardada
   * (`has_password: true`). No enviar string vacío.
   */
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsOptional()
  @IsString()
  finkok_password?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  is_active?: number;

  /** No enviar en Guardar del tab. El default se cambia con PATCH /stamping-environment. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  is_stamping_default?: number;
}
