import { ApiProperty } from '@nestjs/swagger';

export class InventoryTransferLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() source_inventory_batch_id: string;
  @ApiProperty() source_batch_id: string;
  @ApiProperty() source_batch_number: string;
  @ApiProperty({ nullable: true }) destination_inventory_batch_id: string | null;
  @ApiProperty({ nullable: true }) destination_batch_id: string | null;
  @ApiProperty() destination_batch_number: string;
  @ApiProperty() quantity: string;
  @ApiProperty({ nullable: true }) quantity_received: string | null;
  @ApiProperty({ nullable: true }) measure_label: string | null;
  @ApiProperty() created_at: Date;
}

export class InventoryTransferProductSummaryDto {
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() quantity: string;
  @ApiProperty() lines_count: number;
}

export class InventoryTransferWarehouseSummaryDto {
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

export class InventoryTransferUserSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
}

export class InventoryTransferResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() folio: string;
  @ApiProperty({ nullable: true, description: 'Presente solo si todas las líneas son del mismo producto' })
  product_id: string | null;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty({ nullable: true }) uom_id: string | null;
  @ApiProperty() uom_name: string;
  @ApiProperty({ type: [InventoryTransferProductSummaryDto] })
  products: InventoryTransferProductSummaryDto[];
  @ApiProperty() products_count: number;
  @ApiProperty({ type: InventoryTransferWarehouseSummaryDto })
  source_warehouse: InventoryTransferWarehouseSummaryDto;
  @ApiProperty({ type: InventoryTransferWarehouseSummaryDto })
  destination_warehouse: InventoryTransferWarehouseSummaryDto;
  @ApiProperty() total_quantity: string;
  @ApiProperty() status: string;
  @ApiProperty({ nullable: true }) notes: string | null;
  @ApiProperty({ nullable: true }) reception_notes: string | null;
  @ApiProperty({ nullable: true }) received_at: Date | null;
  @ApiProperty({ nullable: true }) shipping_id: string | null;
  @ApiProperty({ nullable: true }) shipping_status: string | null;
  @ApiProperty({ nullable: true }) shipping_date: string | null;
  @ApiProperty({ nullable: true }) shipping_driver_name: string | null;
  @ApiProperty({ nullable: true }) shipping_truck_name: string | null;
  @ApiProperty({ nullable: true, description: 'Cuántas transferencias lleva el envío activo' })
  shipping_transfer_count: number | null;
  @ApiProperty({ type: InventoryTransferUserSummaryDto })
  created_by_user: InventoryTransferUserSummaryDto;
  @ApiProperty() created_at: Date;
  @ApiProperty({ type: [InventoryTransferLineResponseDto] })
  lines: InventoryTransferLineResponseDto[];
}

export class InventoryTransferListResponseDto {
  @ApiProperty({ type: [InventoryTransferResponseDto] })
  data: InventoryTransferResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
