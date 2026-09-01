import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateControlDeskPositionDto {
  @IsUUID()
  billing_branch_id: string;

  @IsString()
  @MaxLength(20)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  row?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  col?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
