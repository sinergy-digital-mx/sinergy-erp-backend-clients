export interface CustomerPriceListAssignmentInput {
  price_list_id: string;
  is_default?: boolean;
}

export function normalizeCustomerPriceListAssignments(
  items: CustomerPriceListAssignmentInput[] | null | undefined,
): Array<{ price_list_id: string; is_default: boolean }> {
  const unique: Array<{ price_list_id: string; is_default: boolean }> = [];
  const seen = new Set<string>();
  for (const item of items ?? []) {
    const priceListId = String(item?.price_list_id ?? '').trim();
    if (!priceListId || seen.has(priceListId)) continue;
    seen.add(priceListId);
    unique.push({
      price_list_id: priceListId,
      is_default: item.is_default === true,
    });
  }
  if (unique.length === 0) return [];
  const defaultId =
    unique.find((item) => item.is_default)?.price_list_id ?? unique[0].price_list_id;
  return unique.map((item) => ({
    price_list_id: item.price_list_id,
    is_default: item.price_list_id === defaultId,
  }));
}
