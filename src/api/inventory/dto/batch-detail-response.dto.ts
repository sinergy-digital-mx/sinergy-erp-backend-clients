import { ApiProperty } from '@nestjs/swagger';

export class MovementSummaryDto {
  @ApiProperty() total_movements: number;
  @ApiProperty() total_out: number;
  @ApiProperty() total_in: number;
  @ApiProperty({
    type: 'object',
    properties: {
      orders: { type: 'number' },
      transfers_out: { type: 'number' },
      transfers_in: { type: 'number' },
      adjustments: { type: 'number' },
    },
  })
  by_type: {
    orders: number;
    transfers_out: number;
    transfers_in: number;
    adjustments: number;
  };
}

/**
 * Detailed response DTO for a single inventory batch
 * Includes product, warehouse, purchase order info, quantity breakdown, and movement summary
 */
export class BatchDetailResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() batch_number: string;

  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;

  @ApiProperty() warehouse_id: string;
  @ApiProperty() warehouse_name: string;

  @ApiProperty({ nullable: true }) purchase_order_id: string | null;
  @ApiProperty({ nullable: true }) purchase_order_batch_id: string | null;
  @ApiProperty({ nullable: true }) purchase_order_detail_id: string | null;
  @ApiProperty({ nullable: true }) purchase_order_folio: string | null;

  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;

  /** Quantity at the time of batch creation (same as current quantity since no movement tracking yet) */
  @ApiProperty() initial_quantity: string;
  /** Currently available quantity */
  @ApiProperty() available_quantity: string;
  /** Consumed quantity (initial - available) */
  @ApiProperty() quantity_consumed: string;
  /** Availability percentage (0-100) */
  @ApiProperty() availability_percentage: number;

  @ApiProperty() created_by: string;
  @ApiProperty() created_at: Date;

  @ApiProperty({ type: MovementSummaryDto })
  movement_summary: MovementSummaryDto;
}
