import { ApiProperty } from '@nestjs/swagger';
import { InventoryAuditStatus } from '../../../entities/inventory/inventory-audit-status.enum';

export class InventoryAuditUserSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
}

export class InventoryAuditWarehouseSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) code: string | null;
  @ApiProperty({ nullable: true }) billing_branch_id: string | null;
  @ApiProperty({ nullable: true }) billing_branch_code: string | null;
  @ApiProperty({ nullable: true }) billing_branch_city: string | null;
  @ApiProperty({ nullable: true }) billing_branch_state: string | null;
  @ApiProperty({ nullable: true }) fiscal_configuration_id: string | null;
  @ApiProperty({ nullable: true }) fiscal_razon_social: string | null;
  @ApiProperty({ nullable: true }) fiscal_rfc: string | null;
}

export class InventoryAuditLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() inventory_batch_id: string;
  @ApiProperty() batch_number: string;
  @ApiProperty({ nullable: true }) source_tag_identifier: string | null;
  @ApiProperty({ nullable: true }) measure: string | null;
  @ApiProperty({ nullable: true }) measure_uom_id: string | null;
  @ApiProperty({ nullable: true }) measure_uom_name: string | null;
  @ApiProperty({ nullable: true }) measure_label: string | null;
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() system_quantity: string;
  @ApiProperty({ nullable: true }) counted_quantity: string | null;
  @ApiProperty({ nullable: true }) variance: string | null;
  @ApiProperty({ nullable: true }) reason: string | null;
  @ApiProperty() is_additional: boolean;
  @ApiProperty({ nullable: true, type: InventoryAuditUserSummaryDto })
  counted_by_user: InventoryAuditUserSummaryDto | null;
  @ApiProperty({ nullable: true }) counted_at: Date | null;
  @ApiProperty({ nullable: true }) quantity_before_post: string | null;
  @ApiProperty({ nullable: true }) quantity_after_post: string | null;
  @ApiProperty() stock_moved_during_count: boolean;
  @ApiProperty() created_at: Date;
}

export class InventoryAuditTotalsDto {
  @ApiProperty() total_lines: number;
  @ApiProperty() counted_lines: number;
  @ApiProperty() pending_lines: number;
  @ApiProperty() lines_with_variance: number;
  @ApiProperty() total_system_quantity: string;
  @ApiProperty({ nullable: true }) total_counted_quantity: string | null;
  @ApiProperty({ nullable: true }) total_variance: string | null;
}

export class InventoryAuditResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() folio: string;
  @ApiProperty({ enum: InventoryAuditStatus }) status: InventoryAuditStatus;
  @ApiProperty({ type: InventoryAuditWarehouseSummaryDto })
  warehouse: InventoryAuditWarehouseSummaryDto;
  @ApiProperty({ nullable: true }) product_id: string | null;
  @ApiProperty({ nullable: true }) product_name: string | null;
  @ApiProperty({ nullable: true }) product_sku: string | null;
  @ApiProperty() include_empty_lots: boolean;
  @ApiProperty({ nullable: true }) notes: string | null;
  @ApiProperty({ type: InventoryAuditUserSummaryDto })
  created_by_user: InventoryAuditUserSummaryDto;
  @ApiProperty() created_at: Date;
  @ApiProperty({ nullable: true, type: InventoryAuditUserSummaryDto })
  submitted_by_user: InventoryAuditUserSummaryDto | null;
  @ApiProperty({ nullable: true }) submitted_at: Date | null;
  @ApiProperty({ nullable: true, type: InventoryAuditUserSummaryDto })
  authorized_by_user: InventoryAuditUserSummaryDto | null;
  @ApiProperty({ nullable: true }) authorized_at: Date | null;
  @ApiProperty({ nullable: true, type: InventoryAuditUserSummaryDto })
  rejected_by_user: InventoryAuditUserSummaryDto | null;
  @ApiProperty({ nullable: true }) rejected_at: Date | null;
  @ApiProperty({ nullable: true }) rejection_reason: string | null;
  @ApiProperty({ nullable: true, type: InventoryAuditUserSummaryDto })
  cancelled_by_user: InventoryAuditUserSummaryDto | null;
  @ApiProperty({ nullable: true }) cancelled_at: Date | null;
  @ApiProperty({ nullable: true }) cancellation_reason: string | null;
  @ApiProperty({ type: InventoryAuditTotalsDto })
  totals: InventoryAuditTotalsDto;
  @ApiProperty({ type: [InventoryAuditLineResponseDto] })
  lines: InventoryAuditLineResponseDto[];
}

export class InventoryAuditListResponseDto {
  @ApiProperty({ type: [InventoryAuditResponseDto] })
  data: InventoryAuditResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class InventoryAuditContextBatchDto {
  @ApiProperty() batch_id: string;
  @ApiProperty() batch_number: string;
  @ApiProperty({ nullable: true }) source_tag_identifier: string | null;
  @ApiProperty({ nullable: true }) measure: string | null;
  @ApiProperty({ nullable: true }) measure_uom_id: string | null;
  @ApiProperty({ nullable: true }) measure_uom_name: string | null;
  @ApiProperty({ nullable: true }) measure_label: string | null;
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() available_quantity: string;
  @ApiProperty() initial_quantity: string;
  @ApiProperty({ nullable: true }) purchase_order_folio: string | null;
  @ApiProperty() created_at: Date;
}

export class InventoryAuditContextResponseDto {
  @ApiProperty({ type: InventoryAuditWarehouseSummaryDto })
  warehouse: InventoryAuditWarehouseSummaryDto;
  @ApiProperty() total_batches: number;
  @ApiProperty() total_available_quantity: string;
  @ApiProperty({ nullable: true }) open_audit_id: string | null;
  @ApiProperty({ nullable: true }) open_audit_folio: string | null;
  @ApiProperty({ type: [InventoryAuditContextBatchDto] })
  batches: InventoryAuditContextBatchDto[];
}
