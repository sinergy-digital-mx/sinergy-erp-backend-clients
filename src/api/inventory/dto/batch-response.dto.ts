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

  @ApiProperty({ description: 'Source lot tag/identifier from receipt', nullable: true })
  source_tag_identifier: string | null;

  @ApiProperty({ description: 'Warehouse ID' })
  warehouse_id: string;

  @ApiProperty({ description: 'Warehouse name' })
  warehouse_name?: string;

  @ApiProperty({ description: 'Razón social ID', nullable: true })
  fiscal_configuration_id?: string | null;

  @ApiProperty({ description: 'Razón social', nullable: true })
  razon_social?: string | null;

  @ApiProperty({ description: 'Sucursal ID', nullable: true })
  billing_branch_id?: string | null;

  @ApiProperty({ description: 'Nombre de sucursal', nullable: true })
  sucursal?: string | null;

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

  @ApiProperty({ description: 'Purchase Order folio', nullable: true })
  purchase_order_folio?: string;

  @ApiProperty({ description: 'User who created the batch' })
  created_by: string;

  @ApiProperty({ description: 'Batch creation date' })
  created_at: Date;
}
