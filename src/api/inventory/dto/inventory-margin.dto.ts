import { ApiProperty } from '@nestjs/swagger';

export class InventoryMarginDto {
  @ApiProperty({ nullable: true })
  unit_price: string | null;

  @ApiProperty({ nullable: true })
  price_list_name: string | null;

  @ApiProperty({ nullable: true })
  unit_cost: string | null;

  @ApiProperty({ nullable: true })
  margin_amount: string | null;

  @ApiProperty({ nullable: true })
  margin_percentage: string | null;

  @ApiProperty({ enum: ['purchase', 'configuration', 'mixed', 'none'] })
  source: 'purchase' | 'configuration' | 'mixed' | 'none';

  @ApiProperty()
  source_label: string;

  @ApiProperty()
  hint: string;

  @ApiProperty()
  purchase_count: number;

  @ApiProperty()
  configuration_count: number;

  @ApiProperty()
  missing_count: number;

  @ApiProperty()
  cost_basis: string;

  @ApiProperty({ nullable: true })
  purchase_folio: string | null;
}

export class InventoryMarginLineDto {
  @ApiProperty()
  label: string;

  @ApiProperty({ nullable: true })
  detail: string | null;

  @ApiProperty({ nullable: true })
  amount: string | null;

  @ApiProperty({ nullable: true, enum: ['MXN', 'USD'] })
  currency: 'MXN' | 'USD' | null;

  @ApiProperty()
  included: boolean;
}

export class InventoryMarginGroupDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  note: string | null;

  @ApiProperty({ type: [InventoryMarginLineDto] })
  lines: InventoryMarginLineDto[];
}

export class InventoryMarginExplanationDto {
  @ApiProperty({ type: InventoryMarginDto })
  margin: InventoryMarginDto;

  @ApiProperty()
  headline: string;

  @ApiProperty()
  formula_sentence: string;

  @ApiProperty()
  price_note: string;

  @ApiProperty()
  cost_note: string;

  @ApiProperty({ type: [InventoryMarginGroupDto] })
  groups: InventoryMarginGroupDto[];
}

export class ProductMarginUomDto {
  @ApiProperty()
  uom_id: string;

  @ApiProperty()
  uom_name: string;

  @ApiProperty({ type: InventoryMarginExplanationDto })
  margin_detail: InventoryMarginExplanationDto;
}

export class ProductMarginResponseDto {
  @ApiProperty()
  product_id: string;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  product_sku: string;

  @ApiProperty({ type: [ProductMarginUomDto] })
  uoms: ProductMarginUomDto[];

  @ApiProperty({ nullable: true })
  empty_reason: string | null;
}
