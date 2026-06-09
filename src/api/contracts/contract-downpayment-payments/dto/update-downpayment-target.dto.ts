import { IsNumber, Min } from 'class-validator';

export class UpdateDownpaymentTargetDto {
  @IsNumber()
  @Min(0.01, { message: 'La meta de enganche debe ser mayor a 0' })
  down_payment_target: number;
}
