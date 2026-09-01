import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryControlDeskBoardDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['admin', 'warehouse'])
  view?: 'admin' | 'warehouse';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}
