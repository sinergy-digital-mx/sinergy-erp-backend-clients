import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for a single batch
 * Contains all batch information with related entity details
 */
export class BatchResponseDto {
  @ApiProperty({ description: 'Batch unique identifier' })
  id: string;

  @ApiProperty({ description: 'Batch number' })
  batch_number: string;

  @ApiProperty({ description: 'Warehouse ID' })
  warehouse_id: string;

  @ApiProperty({ description: 'Warehouse name' })
  warehouse_name?: string;

  @ApiProperty({ description: 'Product ID' })
  product_id: string;

  @ApiProperty({ description: 'Product name' })
  product_name?: string;

  @ApiProperty({ description: 'Product SKU' })
  product_sku?: string;

  @ApiProperty({ description: 'Unit of Measure ID' })
  uom_id: string;

  @ApiProperty({ description: 'Unit of Measure name' })
  uom_name?: string;

  @ApiProperty({ description: 'Batch quantity', type: 'string' })
  quantity: string;

  @ApiProperty({ description: 'Purchase Order Batch ID', nullable: true })
  purchase_order_batch_id?: string;

  @ApiProperty({ description: 'Purchase Order ID', nullable: true })
  purchase_order_id?: string;

  @ApiProperty({ description: 'Purchase Order Batch Detail ID', nullable: true })
  purchase_order_detail_id?: string;

  @ApiProperty({ description: 'User who created the batch' })
  created_by: string;

  @ApiProperty({ description: 'Batch creation date' })
  created_at: Date;
}
