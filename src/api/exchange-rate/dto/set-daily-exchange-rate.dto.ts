import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SetDailyExchangeRateDto {
  @IsOptional()
  @IsDateString()
  rate_date?: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  exchange_rate: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
