import { IsString, IsOptional, IsArray, Length } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  description?: string;

  @IsArray()
  @IsOptional()
  permission_ids?: string[];
}
