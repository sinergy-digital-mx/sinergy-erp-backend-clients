import { IsString, IsNumber, IsDate, IsOptional, IsEnum, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  contract_number?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  contract_date?: Date;

  @IsOptional()
  @IsNumber()
  total_price?: number;

  @IsOptional()
  @IsNumber()
  down_payment?: number;

  @IsOptional()
  @IsNumber()
  payment_months?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  first_payment_date?: Date;

  @IsOptional()
  @IsEnum(['activo', 'completado', 'cancelado', 'suspendido'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
