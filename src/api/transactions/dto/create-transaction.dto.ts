import { IsString, IsNumber, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsNumber()
  @IsOptional()
  entity_type_id?: number;

  @IsString()
  @IsOptional()
  entity_type_code?: string; // Alternative to entity_type_id

  @IsString()
  entity_id: string; // UUID of the entity

  @IsString()
  transaction_number: string;

  @IsDate()
  @Type(() => Date)
  transaction_date: Date;

  @IsNumber()
  amount: number;

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
