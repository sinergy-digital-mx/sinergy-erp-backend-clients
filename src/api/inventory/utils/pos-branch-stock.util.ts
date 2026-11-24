/** Máximo de productos que devuelve la consulta de existencias del POS. */
export const POS_BRANCH_STOCK_PRODUCT_LIMIT = 12;

export interface PosBranchStockBranchInput {
  id: string;
  name: string;
  city: string | null;
}

export interface PosBranchStockProductInput {
  id: string;
  sku: string;
  name: string;
}

export interface PosBranchStockQtyInput {
  product_id: string;
  billing_branch_id: string;
  quantity: number;
  uom_name: string | null;
}

export interface PosBranchStockCellView {
  billing_branch_id: string;
  quantity: string;
  uom_name: string | null;
}

export interface PosBranchStockProductView {
  product_id: string;
  sku: string;
  name: string;
  uom_name: string;
  total_quantity: string;
  branches: PosBranchStockCellView[];
}

export function formatPosBranchStockQty(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(3);
}

/**
 * Una celda por sucursal activa, con cero si no hay lotes.
 * El total solo suma esas sucursales. La unidad es la de la sucursal con más existencia.
 */
export function buildPosBranchStockProducts(
  products: PosBranchStockProductInput[],
  branches: PosBranchStockBranchInput[],
  rows: PosBranchStockQtyInput[],
): PosBranchStockProductView[] {
  const byProduct = new Map<string, Map<string, PosBranchStockQtyInput>>();

  for (const row of rows) {
    const productId = row.product_id?.trim();
    const branchId = row.billing_branch_id?.trim();
    if (!productId || !branchId) {
      continue;
    }
    let byBranch = byProduct.get(productId);
    if (!byBranch) {
      byBranch = new Map();
      byProduct.set(productId, byBranch);
    }
    const quantity = Number.isFinite(row.quantity) ? row.quantity : 0;
    const previous = byBranch.get(branchId);
    if (!previous) {
      byBranch.set(branchId, {
        product_id: productId,
        billing_branch_id: branchId,
        quantity,
        uom_name: row.uom_name?.trim() || null,
      });
      continue;
    }
    byBranch.set(branchId, {
      ...previous,
      quantity: previous.quantity + quantity,
      uom_name: previous.uom_name || row.uom_name?.trim() || null,
    });
  }

  return products.map((product) => {
    const byBranch = byProduct.get(product.id) ?? new Map<string, PosBranchStockQtyInput>();
    let total = 0;
    let uomName = '';
    let uomQty = -1;

    const cells = branches.map((branch) => {
      const row = byBranch.get(branch.id);
      const quantity = row?.quantity ?? 0;
      total += quantity;
      const name = row?.uom_name?.trim() || '';
      if (name && quantity >= uomQty) {
        uomName = name;
        uomQty = quantity;
      }
      return {
        billing_branch_id: branch.id,
        quantity: formatPosBranchStockQty(quantity),
        uom_name: name || null,
      };
    });

    return {
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      uom_name: uomName || 'Pieza',
      total_quantity: formatPosBranchStockQty(total),
      branches: cells,
    };
  });
}
