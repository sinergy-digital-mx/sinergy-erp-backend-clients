import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateUoMDto {
  @IsUUID()
  @IsNotEmpty()
  uom_catalog_id: string;
}
