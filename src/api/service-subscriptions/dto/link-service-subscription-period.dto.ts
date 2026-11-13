import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class LinkServiceSubscriptionPeriodDto {
  @IsUUID()
  sales_order_id: string;

  @IsOptional()
  @IsBoolean()
  align_date?: boolean = true;
}
