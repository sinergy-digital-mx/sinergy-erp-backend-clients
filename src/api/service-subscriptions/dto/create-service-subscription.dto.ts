import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceSubscriptionDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  customer_id: number;

  @IsString()
  @MaxLength(160)
  title: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  monthly_amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  iva_percentage?: number;

  @IsUUID()
  fiscal_configuration_id: string;

  @IsUUID()
  billing_branch_id: string;

  @IsUUID()
  product_id: string;

  @IsUUID()
  product_uom_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}/)
  start_month: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}/)
  end_month: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  @Type(() => Number)
  billing_day?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  uso_cfdi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  forma_pago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  metodo_pago?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  regimen_fiscal_receptor?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
