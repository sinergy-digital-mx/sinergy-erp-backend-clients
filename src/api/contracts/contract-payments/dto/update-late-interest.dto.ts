import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLateInterestDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @IsNumber()
  @Min(0)
  amount?: number | null;

  @IsOptional()
  @IsBoolean()
  waived?: boolean;
}
