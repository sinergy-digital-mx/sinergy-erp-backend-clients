import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class ConvertQuantityDto {
  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  from_uom_id: string;

  @IsString()
  @IsNotEmpty()
  to_uom_id: string;
}
