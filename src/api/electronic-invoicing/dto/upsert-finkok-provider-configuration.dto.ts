import { IsEnum, IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpsertFinkokProviderConfigurationDto {
  @IsNotEmpty()
  @IsEnum(['demo', 'production'])
  environment: 'demo' | 'production';

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  finkok_username: string;

  @IsNotEmpty()
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
