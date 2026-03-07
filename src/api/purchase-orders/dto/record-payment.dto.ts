import { IsDateString, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsDateString()
  payment_date: string;

  @IsNumber()
  @Min(0.01)
  payment_amount: number;

  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  reference_number?: string;
}
