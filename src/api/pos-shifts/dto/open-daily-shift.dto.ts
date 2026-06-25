import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenDailyShiftDto {
  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  opening_cash_mxn: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  opening_cash_usd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
