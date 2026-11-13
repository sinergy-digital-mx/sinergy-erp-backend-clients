import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateServiceSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  monthly_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  iva_percentage?: number;

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
