import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateUoMRelationshipDto {
  @IsString()
  @IsNotEmpty()
  source_uom_id: string;

  @IsString()
  @IsNotEmpty()
  target_uom_id: string;

  @IsNumber()
  @IsPositive()
  conversion_factor: number;
}
