import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProcessPaymentDto } from './process-payment.dto';

export class SplitPaymentDto {
  @ApiProperty({
    description: 'Array of payment methods and amounts',
    type: [ProcessPaymentDto],
    example: [
      { payment_method: 'cash', amount: 300 },
      { payment_method: 'card', amount: 200, reference: 'AUTH123' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProcessPaymentDto)
  payments: ProcessPaymentDto[];
}
