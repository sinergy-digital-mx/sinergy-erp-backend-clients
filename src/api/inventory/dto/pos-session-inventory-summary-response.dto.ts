import { ApiProperty } from '@nestjs/swagger';
import { ProductDiscountType } from '../../../entities/products/product-discount.entity';

export class PosSessionApplicableDiscountDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ProductDiscountType }) discount_type: ProductDiscountType;
  @ApiProperty() value: number;
  @ApiProperty({ nullable: true }) product_uom_id: string | null;
}

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
  @ApiProperty({
    description: 'ID de product_uoms para enviar en sales-orders (product_uom_id)',
  })
  product_uom_id: string;
  @ApiProperty({
    description: 'Indica si el producto tiene descuentos activos aplicables a esta UOM',
  })
  has_applicable_discounts: boolean;
  @ApiProperty({ type: [PosSessionApplicableDiscountDto] })
  applicable_discounts: PosSessionApplicableDiscountDto[];
  @ApiProperty() total_available_quantity: string;
  @ApiProperty() total_initial_quantity: string;
  @ApiProperty() total_batches: number;
  @ApiProperty({ type: [PosSessionBatchBreakdownDto] })
  batches: PosSessionBatchBreakdownDto[];
}

export class PosSessionWarehouseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() status: string;
}

export class PosSessionInventorySummaryResponseDto {
  @ApiProperty({ description: 'Sucursal de la terminal POS (billing_branch_id del usuario)' })
  billing_branch_id: string;

  @ApiProperty({
    nullable: true,
    description: 'Razón social de esa sucursal. Usar al crear la orden POS.',
  })
  fiscal_configuration_id: string | null;

  @ApiProperty({
    type: [PosSessionWarehouseDto],
    description: 'Almacenes de esa sucursal. Usar uno de estos ids si se filtra por warehouse_id.',
  })
  warehouses: PosSessionWarehouseDto[];

  @ApiProperty({
    nullable: true,
    description: 'Almacén aplicado al filtro. null = todos los de la sucursal.',
  })
  applied_warehouse_id: string | null;

  @ApiProperty({ type: [PosSessionProductInventorySummaryDto] })
  data: PosSessionProductInventorySummaryDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}
