import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class ReorderProductPhotosDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  photo_ids: string[];
}
