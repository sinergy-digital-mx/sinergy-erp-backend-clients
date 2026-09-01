import { ApiProperty } from '@nestjs/swagger';
import { InventoryBatchMovementDto } from './inventory-batch-movement.dto';

export class BatchTransferHistoryItemDto {
  @ApiProperty() transfer_id: string;
  @ApiProperty() transfer_folio: string;
  @ApiProperty() direction: 'out' | 'in';
  @ApiProperty() quantity: string;
  @ApiProperty({ nullable: true }) related_batch_id: string | null;
  @ApiProperty({ nullable: true }) related_batch_number: string | null;
  @ApiProperty({ nullable: true }) warehouse_name: string | null;
  @ApiProperty() created_at: Date;
}

export class BatchAuditHistoryItemDto {
  @ApiProperty() audit_id: string;
  @ApiProperty() audit_folio: string;
  @ApiProperty() system_quantity: string;
  @ApiProperty({ nullable: true }) counted_quantity: string | null;
  @ApiProperty({ nullable: true }) variance: string | null;
  @ApiProperty({ nullable: true }) quantity_before_post: string | null;
  @ApiProperty({ nullable: true }) quantity_after_post: string | null;
  @ApiProperty({ nullable: true }) reason: string | null;
  @ApiProperty({ nullable: true }) counted_by_name: string | null;
  @ApiProperty({ nullable: true }) authorized_by_name: string | null;
  @ApiProperty({ nullable: true }) authorized_at: Date | null;
}

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
  @ApiProperty({ nullable: true }) source_tag_identifier: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Tamaño (8, 12). Independiente de uom_id / uom_name (PT, ft²).',
  })
  measure: string | null;
  @ApiProperty({ nullable: true }) measure_uom_id: string | null;
  @ApiProperty({ nullable: true }) measure_uom_name: string | null;
  @ApiProperty({ nullable: true, description: 'Ej. "8 Foot"' })
  measure_label: string | null;

  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;

  @ApiProperty() warehouse_id: string;
  @ApiProperty() warehouse_name: string;

  @ApiProperty({ nullable: true, description: 'Razón social ID' })
  fiscal_configuration_id: string | null;
  @ApiProperty({ nullable: true, description: 'Razón social' })
  razon_social: string | null;
  @ApiProperty({ nullable: true, description: 'Sucursal ID' })
  billing_branch_id: string | null;
  @ApiProperty({ nullable: true, description: 'Nombre de sucursal' })
  sucursal: string | null;

  @ApiProperty({ nullable: true }) purchase_order_id: string | null;
  @ApiProperty({ nullable: true }) purchase_order_batch_id: string | null;
  @ApiProperty({ nullable: true }) purchase_order_detail_id: string | null;
  @ApiProperty({ nullable: true }) purchase_order_folio: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Número de pedimento de la OC de origen. Null si no hay OC o la OC no tiene pedimento.',
  })
  pedimento_number: string | null;

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

  @ApiProperty({ nullable: true, description: 'Lote origen si este lote fue creado por transferencia' })
  transferred_from_batch_id: string | null;

  @ApiProperty({ nullable: true })
  transferred_from_batch_number: string | null;

  @ApiProperty({ type: [BatchTransferHistoryItemDto] })
  transfer_history: BatchTransferHistoryItemDto[];

  @ApiProperty({ type: [BatchAuditHistoryItemDto] })
  audit_history: BatchAuditHistoryItemDto[];

  @ApiProperty({ type: [InventoryBatchMovementDto] })
  movements: InventoryBatchMovementDto[];

  @ApiProperty()
  movements_count: number;

  @ApiProperty({ type: MovementSummaryDto })
  movement_summary: MovementSummaryDto;

  @ApiProperty({ description: 'Siempre true. El tag se puede cambiar o borrar.' })
  can_edit_tag: boolean;

  @ApiProperty({
    description:
      'True solo si measure es null (no se capturó en el recibo). Una vez definida, no se edita.',
  })
  can_edit_measure: boolean;

  @ApiProperty({
    description:
      'True si hay disponible. El almacén se cambia con transferencia, no con PATCH.',
  })
  can_transfer: boolean;
}
