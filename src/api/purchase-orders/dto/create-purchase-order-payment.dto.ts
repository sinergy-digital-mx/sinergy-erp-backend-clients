import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePurchaseOrderPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  payment_date: string;

  @IsString()
  @MaxLength(100)
  payment_method: string;

  @IsEnum(['MXN', 'USD'])
  currency: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference_number?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
