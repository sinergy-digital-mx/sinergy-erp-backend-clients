import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for fulfilling (surtir) a sales order.
 * No line items needed — the system resolves batch allocations automatically via FIFO.
 */
export class FulfillSalesOrderDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
