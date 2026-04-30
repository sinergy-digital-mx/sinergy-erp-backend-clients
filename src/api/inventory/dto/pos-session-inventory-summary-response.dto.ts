import { ApiProperty } from '@nestjs/swagger';

export class PosSessionBatchBreakdownDto {
  @ApiProperty() batch_id: string;
  @ApiProperty() batch_number: string;
  @ApiProperty({ nullable: true }) source_tag_identifier: string | null;
  @ApiProperty() warehouse_id: string;
  @ApiProperty() warehouse_name: string;
  @ApiProperty() available_quantity: string;
  @ApiProperty() initial_quantity: string;
  @ApiProperty() purchase_order_folio: string | null;
  @ApiProperty() created_at: Date;
}

export class PosSessionProductInventorySummaryDto {
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty({ nullable: true, description: 'Signed product photo URL (temporary access)' })
  product_photo: string | null;
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;
  @ApiProperty({ type: [String] }) warehouse_ids: string[];
  @ApiProperty({ type: [String] }) warehouse_names: string[];
  @ApiProperty({ nullable: true }) suggested_unit_price: string | null;
  @ApiProperty({ nullable: true }) suggested_iva_percentage: string | null;
  @ApiProperty({ nullable: true }) suggested_ieps_percentage: string | null;
  @ApiProperty({ type: [Object] })
  pricing_options: Array<{
    price_list_id: string;
    price_list_name: string;
    price: string;
    iva_percentage: string;
    ieps_percentage: string;
    total: string;
  }>;
  @ApiProperty() total_available_quantity: string;
  @ApiProperty() total_initial_quantity: string;
  @ApiProperty() total_batches: number;
  @ApiProperty({ type: [PosSessionBatchBreakdownDto] })
  batches: PosSessionBatchBreakdownDto[];
}

export class PosSessionInventorySummaryResponseDto {
  @ApiProperty({ type: [PosSessionProductInventorySummaryDto] })
  data: PosSessionProductInventorySummaryDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
