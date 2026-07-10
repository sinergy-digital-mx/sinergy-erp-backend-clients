import { IsArray, IsString } from 'class-validator';

export class ReplaceRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permission_ids: string[];
}
