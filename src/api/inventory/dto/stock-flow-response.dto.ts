import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockFlowFiltersAppliedDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  period_label: string;

  @ApiProperty()
  date_from: string;

  @ApiProperty()
  date_to: string;

  @ApiProperty()
  fiscal_configuration_id: string;

  @ApiPropertyOptional({ nullable: true })
  billing_branch_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  product_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  vendor_id: string | null;

  @ApiProperty()
  view: string;

  @ApiProperty({ description: 'Montos en MXN (snapshot del kardex)' })
  currency: string;
}

/** Campos de cantidad + valuación MXN compartidos */
export class StockFlowMoneyBlockDto {
  @ApiProperty({ description: 'Valor inventario inicial a costo MXN' })
  opening_cost_mxn: string;

  @ApiProperty({ description: 'Valor inventario inicial a precio venta MXN' })
  opening_sale_mxn: string;

  @ApiProperty({ description: 'Compras / importaciones a costo' })
  purchases_cost_mxn: string;

  @ApiProperty({ description: 'COGS de ventas (costo)' })
  sales_cost_mxn: string;

  @ApiProperty({ description: 'Ingreso de ventas (precio OV)' })
  sales_revenue_mxn: string;

  @ApiProperty()
  transfer_in_cost_mxn: string;

  @ApiProperty()
  transfer_out_cost_mxn: string;

  @ApiProperty()
  adjustments_cost_mxn: string;

  @ApiProperty({ description: 'Valor inventario final a costo MXN' })
  closing_cost_mxn: string;

  @ApiProperty({ description: 'Valor inventario final a precio venta MXN' })
  closing_sale_mxn: string;
}

export class StockFlowSummaryRowDto extends StockFlowMoneyBlockDto {
  @ApiProperty()
  product_id: string;

  @ApiProperty()
  product_sku: string;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  billing_branch_id: string;

  @ApiProperty()
  billing_branch_name: string;

  @ApiProperty()
  fiscal_configuration_name: string;

  @ApiProperty()
  uom_id: string;

  @ApiProperty()
  uom_name: string;

  @ApiProperty()
  opening_qty: string;

  @ApiProperty()
  purchases_qty: string;

  @ApiProperty()
  sales_qty: string;

  @ApiProperty()
  transfer_in_qty: string;

  @ApiProperty()
  transfer_out_qty: string;

  @ApiProperty()
  adjustments_qty: string;

  @ApiProperty()
  closing_qty: string;
}

export class StockFlowTotalizedRowDto extends StockFlowMoneyBlockDto {
  @ApiProperty()
  billing_branch_id: string;

  @ApiProperty()
  billing_branch_name: string;

  @ApiProperty()
  fiscal_configuration_name: string;

  @ApiProperty()
  opening_qty: string;

  @ApiProperty()
  purchases_qty: string;

  @ApiProperty()
  sales_qty: string;

  @ApiProperty()
  transfer_in_qty: string;

  @ApiProperty()
  transfer_out_qty: string;

  @ApiProperty()
  adjustments_qty: string;

  @ApiProperty()
  closing_qty: string;
}

export class StockFlowLedgerRowDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  occurred_at: string;

  @ApiProperty()
  product_id: string;

  @ApiProperty()
  product_sku: string;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  billing_branch_id: string;

  @ApiProperty()
  billing_branch_name: string;

  @ApiProperty()
  uom_name: string;

  @ApiProperty()
  movement_type: string;

  @ApiProperty()
  movement_type_label: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ description: 'Cantidad entrada (vacío si salida o saldo inicial)' })
  quantity_in: string | null;

  @ApiProperty({ description: 'Cantidad salida' })
  quantity_out: string | null;

  @ApiProperty()
  balance_after: string;

  @ApiPropertyOptional({ nullable: true, description: 'Costo unitario MXN snapshot' })
  unit_cost_mxn: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Precio venta unitario MXN snapshot' })
  unit_sale_price_mxn: string | null;

  @ApiPropertyOptional({ nullable: true, description: '|qty| × costo' })
  cost_amount_mxn: string | null;

  @ApiPropertyOptional({ nullable: true, description: '|qty| × precio venta' })
  sale_amount_mxn: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Valor inventario a costo tras el movimiento' })
  cost_balance_after_mxn: string | null;

  @ApiPropertyOptional({ nullable: true })
  reference_folio: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'sales_order | purchase_order | inventory_transfer | inventory_audit | inventory_batch',
  })
  reference_type: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'ID del documento de referencia' })
  reference_id: string | null;

  @ApiProperty()
  is_opening: boolean;
}

export class StockFlowResponseDto {
  @ApiProperty({ type: StockFlowFiltersAppliedDto })
  filters_applied: StockFlowFiltersAppliedDto;

  @ApiProperty({ type: [StockFlowSummaryRowDto] })
  summary: StockFlowSummaryRowDto[];

  @ApiProperty({ type: [StockFlowTotalizedRowDto] })
  totalized: StockFlowTotalizedRowDto[];

  @ApiProperty({ type: [StockFlowLedgerRowDto] })
  ledger: StockFlowLedgerRowDto[];

  @ApiProperty()
  total_summary_rows: number;

  @ApiProperty()
  total_totalized_rows: number;

  @ApiProperty()
  total_ledger_rows: number;

  @ApiProperty({ description: 'Página actual (1-based)' })
  page: number;

  @ApiProperty({ description: 'Filas por página' })
  limit: number;

  @ApiProperty({ description: 'Total de filas de la vista activa' })
  total: number;

  @ApiProperty({ description: 'Total de páginas de la vista activa' })
  total_pages: number;
}
