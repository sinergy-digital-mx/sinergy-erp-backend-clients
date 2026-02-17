import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  permission_ids: string[];
}
