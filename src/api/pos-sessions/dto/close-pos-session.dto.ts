import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClosePosSessionDto {
  @ApiProperty({
    description: 'Final cash amount counted in the drawer',
    example: 1250.50,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  closing_cash: number;

  @ApiProperty({
    description: 'Optional notes for session closing',
    example: 'End of morning shift, all transactions reconciled',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
