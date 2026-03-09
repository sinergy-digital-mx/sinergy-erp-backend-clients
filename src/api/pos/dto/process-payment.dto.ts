import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Payment method',
    enum: ['cash', 'card', 'transfer', 'mixed'],
    example: 'cash',
  })
  @IsEnum(['cash', 'card', 'transfer', 'mixed'])
  payment_method: string;

  @ApiProperty({ description: 'Payment amount', example: 500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Received amount (for cash)', example: 600 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  received_amount?: number;

  @ApiPropertyOptional({ description: 'Card authorization reference', example: 'AUTH123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Tip amount', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tip?: number;
}
