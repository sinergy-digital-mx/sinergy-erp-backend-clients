import { ApiProperty } from '@nestjs/swagger';
import { InventoryLocationFiscalDto } from './inventory-location-tree-response.dto';

export class TransferContextBatchDto {
  @ApiProperty() batch_id: string;
  @ApiProperty() batch_number: string;
  @ApiProperty({ nullable: true }) source_tag_identifier: string | null;
  @ApiProperty() available_quantity: string;
  @ApiProperty() initial_quantity: string;
  @ApiProperty({ nullable: true }) purchase_order_folio: string | null;
  @ApiProperty() created_at: Date;
}

export class TransferContextFiscalDto {
  @ApiProperty() id: string;
  @ApiProperty() razon_social: string;
  @ApiProperty() rfc: string;
}

export class TransferContextBranchDto {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() city: string;
  @ApiProperty() state: string;
  @ApiProperty({ type: TransferContextFiscalDto, nullable: true })
  fiscal_configuration: TransferContextFiscalDto | null;
}

export class TransferContextWarehouseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) code: string | null;
  @ApiProperty({ nullable: true }) billing_branch_id: string | null;
  @ApiProperty({ type: TransferContextBranchDto, nullable: true })
  billing_branch: TransferContextBranchDto | null;
}

export class TransferContextResponseDto {
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() total_available_quantity: string;
  @ApiProperty() total_batches: number;
  @ApiProperty({ type: TransferContextWarehouseDto })
  source_warehouse: TransferContextWarehouseDto;
  @ApiProperty({
    type: [InventoryLocationFiscalDto],
    description:
      'Árbol destino razón social → sucursal → almacén (activos, sin el almacén origen)',
  })
  destinations: InventoryLocationFiscalDto[];
  @ApiProperty({ type: [TransferContextBatchDto] })
  batches: TransferContextBatchDto[];
}
