import { IsString, IsOptional } from 'class-validator';

export class UpdateUoMDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
