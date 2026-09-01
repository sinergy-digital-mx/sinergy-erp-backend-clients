import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CompletePickLineDto {
  @IsUUID()
  id: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity_base_picked: number;
}

export class CompletePickTaskDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CompletePickLineDto)
  lines?: CompletePickLineDto[];
}
