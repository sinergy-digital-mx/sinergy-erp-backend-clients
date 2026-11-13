import { CreateSalesOrderDto, CreateSalesOrderLineItemDto } from '../dto/create-sales-order.dto';

interface CloneSourceLine {
  id: string;
  product_id: string;
  product_uom_id: string;
  quantity: number | string;
  unit_price: number | string;
  discount_percentage?: number | string | null;
  product_discount_id?: string | null;
  iva_percentage?: number | string | null;
  ieps_percentage?: number | string | null;
  custom_description?: string | null;
  notes?: string | null;
}

export interface CloneSourceOrder {
  fiscal_configuration_id: string;
  billing_branch_id: string | null;
  customer_id: number;
  sales_order_type: string;
  currency: string;
  sale_scope: string;
  fiscal_razon_social?: string | null;
  notes?: string | null;
  seller_user_id?: string | null;
  assigned_seller_user_id?: string | null;
  global_discount_id?: string | null;
  requires_selection_assembly?: boolean | null;
  for_shipping?: boolean | null;
  line_items?: CloneSourceLine[];
}

export interface CloneLineOverride {
  line_id: string;
  custom_description?: string;
  unit_price?: number;
}

export interface CloneOverrides {
  lines?: CloneLineOverride[];
  notes?: string;
  expected_delivery_date?: string;
}

export function buildCloneSalesOrderDto(
  source: CloneSourceOrder,
  overrides: CloneOverrides,
  today: string,
): CreateSalesOrderDto {
  const sourceLines = source.line_items ?? [];
  const byId = new Map((overrides.lines ?? []).map((line) => [line.line_id, line]));

  for (const lineId of byId.keys()) {
    if (!sourceLines.some((line) => line.id === lineId)) {
      throw new Error(`La línea ${lineId} no pertenece a la orden`);
    }
  }

  const lineItems = sourceLines.map((line) => {
    const override = byId.get(line.id);
    const item = new CreateSalesOrderLineItemDto();
    item.product_id = line.product_id;
    item.product_uom_id = line.product_uom_id;
    item.quantity = Number(line.quantity);
    item.unit_price = override?.unit_price ?? Number(line.unit_price);
    if (line.product_discount_id) {
      item.product_discount_id = line.product_discount_id;
    } else {
      item.discount_percentage = Number(line.discount_percentage) || 0;
    }
    item.iva_percentage = Number(line.iva_percentage) || 0;
    item.ieps_percentage = Number(line.ieps_percentage) || 0;

    const description =
      override?.custom_description !== undefined
        ? override.custom_description.trim()
        : (line.custom_description ?? '').trim();
    if (description) item.custom_description = description;

    const note = (line.notes ?? '').trim();
    if (note) item.notes = note;
    return item;
  });

  const dto = new CreateSalesOrderDto();
  dto.fiscal_configuration_id = source.fiscal_configuration_id;
  if (source.billing_branch_id) dto.billing_branch_id = source.billing_branch_id;
  dto.customer_id = source.customer_id;
  dto.expected_delivery_date = overrides.expected_delivery_date ?? today;
  dto.sales_order_type = 'MANUAL';
  dto.currency = source.currency === 'USD' ? 'USD' : 'MXN';
  dto.sale_scope = source.sale_scope as CreateSalesOrderDto['sale_scope'];
  dto.payment_status = 'Pendiente';
  if (source.fiscal_razon_social) dto.fiscal_razon_social = source.fiscal_razon_social;
  const notes = overrides.notes !== undefined ? overrides.notes : source.notes;
  if (notes) dto.notes = notes;
  if (source.seller_user_id) dto.seller_user_id = source.seller_user_id;
  if (source.assigned_seller_user_id) {
    dto.assigned_seller_user_id = source.assigned_seller_user_id;
  }
  if (source.global_discount_id) dto.global_discount_id = source.global_discount_id;
  dto.requires_selection_assembly = !!source.requires_selection_assembly;
  dto.for_shipping = !!source.for_shipping;
  dto.line_items = lineItems;
  return dto;
}

interface CarryLine {
  product_id: string;
  product_uom_id: string;
  custom_description?: string | null;
}

export function carryOverCustomDescriptions(
  previous: CarryLine[],
  incoming: Array<{ product_id: string; product_uom_id: string; custom_description?: string }>,
): void {
  const pool = previous.filter((line) => line.custom_description?.trim());
  for (const item of incoming) {
    if (item.custom_description !== undefined) continue;
    const index = pool.findIndex(
      (line) => line.product_id === item.product_id && line.product_uom_id === item.product_uom_id,
    );
    if (index < 0) continue;
    item.custom_description = pool[index].custom_description!.trim();
    pool.splice(index, 1);
  }
}
