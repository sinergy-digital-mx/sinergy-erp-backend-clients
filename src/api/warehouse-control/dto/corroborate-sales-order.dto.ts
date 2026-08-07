import { IsOptional, IsString } from 'class-validator';

export class CorroborateSalesOrderDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
