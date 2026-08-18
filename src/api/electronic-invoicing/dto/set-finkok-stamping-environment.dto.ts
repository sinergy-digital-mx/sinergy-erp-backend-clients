import { IsEnum } from 'class-validator';

export class SetFinkokStampingEnvironmentDto {
  @IsEnum(['demo', 'production'], {
    message: 'El ambiente debe ser demo o production',
  })
  environment: 'demo' | 'production';
}
