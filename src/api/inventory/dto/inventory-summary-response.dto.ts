import { ApiProperty } from '@nestjs/swagger';

export class BatchBreakdownDto {
  @ApiProperty() batch_id: string;
  @ApiProperty() batch_number: string;
  @ApiProperty() available_quantity: string;
  @ApiProperty() initial_quantity: string;
  @ApiProperty() purchase_order_folio: string | null;
  @ApiProperty() created_at: Date;
}

export class ProductInventorySummaryDto {
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() warehouse_id: string;
  @ApiProperty() warehouse_name: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  
  /** Total available quantity across all batches for this product+warehouse */
  @ApiProperty() total_available_quantity: string;
  
  /** Total initial quantity across all batches */
  @ApiProperty() total_initial_quantity: string;
  
  /** Number of batches contributing to this total */
  @ApiProperty() total_batches: number;
  
  /** Breakdown of each batch contributing to this product's inventory */
  @ApiProperty({ type: [BatchBreakdownDto] })
  batches: BatchBreakdownDto[];
}

export class InventorySummaryResponseDto {
  @ApiProperty({ type: [ProductInventorySummaryDto] })
  data: ProductInventorySummaryDto[];
  
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
