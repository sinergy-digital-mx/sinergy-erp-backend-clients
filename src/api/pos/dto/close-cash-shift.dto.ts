import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseCashShiftDto {
  @ApiProperty({ description: 'Final cash amount counted', example: 5000 })
  @IsNumber()
  @Min(0)
  final_cash: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Todo correcto' })
  @IsOptional()
  @IsString()
  notes?: string;
}
