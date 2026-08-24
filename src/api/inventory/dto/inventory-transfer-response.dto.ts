import { ApiProperty } from '@nestjs/swagger';

export class InventoryTransferLineResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() source_inventory_batch_id: string;
  @ApiProperty() source_batch_number: string;
  @ApiProperty() destination_inventory_batch_id: string;
  @ApiProperty() destination_batch_number: string;
  @ApiProperty() quantity: string;
  @ApiProperty() created_at: Date;
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
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty({ type: InventoryTransferWarehouseSummaryDto })
  source_warehouse: InventoryTransferWarehouseSummaryDto;
  @ApiProperty({ type: InventoryTransferWarehouseSummaryDto })
  destination_warehouse: InventoryTransferWarehouseSummaryDto;
  @ApiProperty() total_quantity: string;
  @ApiProperty() status: string;
  @ApiProperty({ nullable: true }) notes: string | null;
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
