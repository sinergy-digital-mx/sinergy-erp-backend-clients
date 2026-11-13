import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class RenewServiceSubscriptionDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}/)
  start_month?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}/)
  end_month?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  monthly_amount?: number;
}
