import { ApiProperty } from '@nestjs/swagger';

export class BatchBreakdownDto {
  @ApiProperty() batch_id: string;
  @ApiProperty() batch_number: string;
  @ApiProperty({ nullable: true }) source_tag_identifier: string | null;
  @ApiProperty({
    nullable: true,
    description: 'Tamaño (8, 12). Independiente de la UOM de inventario.',
  })
  measure: string | null;
  @ApiProperty({ nullable: true }) measure_uom_id: string | null;
  @ApiProperty({ nullable: true }) measure_uom_name: string | null;
  @ApiProperty({ nullable: true, description: 'Ej. "8 Foot". No concatenar con uom_name.' })
  measure_label: string | null;
  @ApiProperty() available_quantity: string;
  @ApiProperty() initial_quantity: string;
  @ApiProperty() purchase_order_folio: string | null;
  @ApiProperty() created_at: Date;
}

export class MeasureTotalDto {
  @ApiProperty({
    nullable: true,
    description: 'Tamaño (8, 12). Null = lotes de este SKU sin tamaño.',
  })
  measure: string | null;
  @ApiProperty({ nullable: true }) measure_uom_id: string | null;
  @ApiProperty({ nullable: true }) measure_uom_name: string | null;
  @ApiProperty({ nullable: true, description: 'Ej. "8 Foot"' })
  measure_label: string | null;
  @ApiProperty() total_available_quantity: string;
  @ApiProperty() total_initial_quantity: string;
  @ApiProperty() total_batches: number;
}

export class ProductInventorySummaryDto {
  @ApiProperty() product_id: string;
  @ApiProperty() product_name: string;
  @ApiProperty() product_sku: string;
  @ApiProperty({ nullable: true, description: 'Signed product photo URL (temporary access)' })
  product_photo: string | null;
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
  @ApiProperty() uom_id: string;
  @ApiProperty() uom_name: string;

  @ApiProperty({ nullable: true, description: 'Suggested unit price for this product/UOM' })
  suggested_unit_price: string | null;

  @ApiProperty({ nullable: true, description: 'Suggested IVA percentage from price list' })
  suggested_iva_percentage: string | null;

  @ApiProperty({ nullable: true, description: 'Suggested IEPS percentage from price list' })
  suggested_ieps_percentage: string | null;

  @ApiProperty({ type: [Object], description: 'All active price-list options for this product/UOM' })
  pricing_options: Array<{
    price_list_id: string;
    price_list_name: string;
    price: string;
    iva_percentage: string;
    ieps_percentage: string;
    total: string;
  }>;
  
  /** Total available quantity across all batches for this product+warehouse */
  @ApiProperty() total_available_quantity: string;
  
  /** Total initial quantity across all batches */
  @ApiProperty() total_initial_quantity: string;
  
  /** Number of batches contributing to this total */
  @ApiProperty() total_batches: number;

  /**
   * Existencia agrupada por medida (8 vs 12 del mismo SKU).
   * Vacío si ningún lote de esta fila tiene medida.
   */
  @ApiProperty({ type: [MeasureTotalDto] })
  measure_totals: MeasureTotalDto[];

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
