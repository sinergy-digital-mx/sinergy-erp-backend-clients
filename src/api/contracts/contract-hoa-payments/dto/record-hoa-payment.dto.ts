import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RecordHoaPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  payment_date: string;

  @IsNotEmpty()
  @IsString()
  payment_method: string;

  @IsOptional()
  @IsString()
  reference_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
