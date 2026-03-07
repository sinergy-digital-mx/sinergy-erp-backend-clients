import { IsString, MinLength } from 'class-validator';

export class CancelPurchaseOrderDto {
  @IsString()
  @MinLength(10)
  cancellation_reason: string;
}
