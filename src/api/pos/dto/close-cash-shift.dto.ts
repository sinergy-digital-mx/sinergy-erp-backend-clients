import { IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CloseCashShiftDto {
  @ApiProperty({ description: 'Final cash amount counted', example: 5000 })
  @ValidateIf((o) => !o.closing_balance)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  final_cash?: number;

  @ApiPropertyOptional({ description: 'Closing balance (alias for final_cash)', example: 5000 })
  @ValidateIf((o) => !o.final_cash)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  closing_balance?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Todo correcto' })
  @IsOptional()
  @IsString()
  notes?: string;
}
