import { IsEnum } from 'class-validator';

export class SetFinkokStampingEnvironmentDto {
  @IsEnum(['demo', 'production'])
  environment: 'demo' | 'production';
}
