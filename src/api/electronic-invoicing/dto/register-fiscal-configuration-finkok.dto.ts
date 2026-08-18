import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class RegisterFiscalConfigurationFinkokDto {
  /**
   * verify — solo consulta Finkok (get) y vincula si el RFC ya existe.
   * add — intenta add en Finkok si no existe; si ya existe, vincula igual.
   * link_only — marca registrada sin llamar a Finkok (uso manual).
   */
  @IsOptional()
  @IsEnum(['verify', 'add', 'link_only'], {
    message: 'El modo debe ser verify, add o link_only',
  })
  mode?: 'verify' | 'add' | 'link_only';

  /** Ambiente Finkok cuyas credenciales reseller usar (demo o production) */
  @IsOptional()
  @IsEnum(['demo', 'production'], {
    message: 'El ambiente debe ser demo o production',
  })
  environment?: 'demo' | 'production';

  /** Si mode=add y el RFC no está en Finkok, intentar registration add con CSD */
  @IsOptional()
  @IsBoolean()
  add_if_missing?: boolean;
}
