import { IsString, IsNumber, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTransactionDto {
  @IsNumber()
  @IsOptional()
  entity_type_id?: number;

  @IsString()
  @IsOptional()
  entity_type_code?: string;

  @IsString()
  @IsOptional()
  entity_id?: string;

  @IsString()
  @IsOptional()
  transaction_number?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  transaction_date?: Date;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsEnum(['pagado', 'pendiente', 'atrasado', 'cancelado'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
