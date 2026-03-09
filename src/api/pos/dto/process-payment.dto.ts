import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Payment method',
    enum: ['cash', 'card', 'transfer', 'mixed'],
    example: 'cash',
  })
  @IsEnum(['cash', 'card', 'transfer', 'mixed'])
  payment_method: string;

  @ApiProperty({ description: 'Payment amount', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount_paid: number;

  @ApiPropertyOptional({ description: 'Received amount (for cash)', example: 600 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  received_amount?: number;

  @ApiPropertyOptional({ description: 'Card authorization reference', example: 'AUTH123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Tip amount', example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tip?: number;
}
