import { formatMarginAmount } from './inventory-margin.util';

export interface BranchReportBranchInput {
  id: string;
  name: string;
  city: string | null;
  razon_social: string | null;
}

export interface BranchReportLotInput {
  billing_branch_id: string;
  quantity: number;
  uom_name: string | null;
  /** Costo unitario en pesos. Null si el lote no tiene costo usable. */
  unit_cost: number | null;
}

export interface BranchReportLine {
  billing_branch_id: string;
  name: string;
  city: string | null;
  razon_social: string | null;
  uom_name: string | null;
  quantity: string;
  average_unit_cost: string | null;
  total_cost: string | null;
  /** False cuando hay existencia sin costo. El total solo suma lotes con costo. */
  cost_complete: boolean;
}

export interface BranchReportView {
  uom_name: string | null;
  mixed_uom: boolean;
  total_quantity: string | null;
  average_unit_cost: string | null;
  total_cost: string | null;
  cost_complete: boolean;
  lines: BranchReportLine[];
}

/**
 * Sin configuración guardada se ven todas. Si la lista guardada ya no
 * coincide con sucursales activas, también se ven todas.
 * El orden de `savedIds` es el orden del reporte.
 */
export function selectVisibleBranchIds(
  branchIds: string[],
  savedIds: string[] | null | undefined,
): string[] {
  if (!savedIds || savedIds.length === 0) {
    return branchIds;
  }
  const known = new Set(branchIds);
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const id of savedIds) {
    if (!known.has(id) || seen.has(id)) continue;
    seen.add(id);
    picked.push(id);
  }
  return picked.length > 0 ? picked : branchIds;
}

/** Pone las sucursales en el orden guardado. Las que no están en la lista quedan al final. */
export function orderBranchRows<T extends { id: string }>(
  branches: T[],
  orderIds: string[] | null | undefined,
): T[] {
  if (!orderIds || orderIds.length === 0) return branches;
  const rank = new Map<string, number>();
  orderIds.forEach((id, index) => {
    if (!rank.has(id)) rank.set(id, index);
  });
  return [...branches].sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank == null && rightRank == null) return 0;
    if (leftRank == null) return 1;
    if (rightRank == null) return -1;
    return leftRank - rightRank;
  });
}

function formatQty(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(3);
}

function uomKey(name: string | null | undefined): string {
  return (name ?? '').trim().toLocaleLowerCase('es');
}

interface Bucket {
  branch: BranchReportBranchInput;
  uomName: string | null;
  quantity: number;
  pricedQuantity: number;
  pricedCost: number;
}

/**
 * Una fila por sucursal y unidad. El costo promedio es ponderado por existencia.
 * La sucursal en cero también sale, para ver dónde no hay.
 */
export function buildBranchStockReport(
  branches: BranchReportBranchInput[],
  lots: BranchReportLotInput[],
): BranchReportView {
  const buckets = new Map<string, Bucket>();

  for (const branch of branches) {
    buckets.set(`${branch.id}|`, {
      branch,
      uomName: null,
      quantity: 0,
      pricedQuantity: 0,
      pricedCost: 0,
    });
  }

  for (const lot of lots) {
    const branch = branches.find((item) => item.id === lot.billing_branch_id);
    if (!branch) continue;
    const quantity = Number.isFinite(lot.quantity) && lot.quantity > 0 ? lot.quantity : 0;
    if (quantity <= 0) continue;

    const name = lot.uom_name?.trim() || null;
    const key = `${branch.id}|${uomKey(name)}`;
    const emptyKey = `${branch.id}|`;
    let bucket = buckets.get(key);
    if (!bucket) {
      const placeholder = buckets.get(emptyKey);
      if (placeholder && placeholder.quantity === 0 && placeholder.uomName == null) {
        buckets.delete(emptyKey);
        bucket = { ...placeholder, uomName: name };
      } else {
        bucket = {
          branch,
          uomName: name,
          quantity: 0,
          pricedQuantity: 0,
          pricedCost: 0,
        };
      }
      buckets.set(key, bucket);
    }

    bucket.quantity += quantity;
    const cost = lot.unit_cost;
    if (cost != null && Number.isFinite(cost) && cost >= 0) {
      bucket.pricedQuantity += quantity;
      bucket.pricedCost += quantity * cost;
    }
  }

  const branchRank = new Map(branches.map((branch, index) => [branch.id, index]));
  const lines = [...buckets.values()]
    .map((bucket) => toLine(bucket))
    .sort((left, right) => {
      const byBranch =
        (branchRank.get(left.billing_branch_id) ?? 0) - (branchRank.get(right.billing_branch_id) ?? 0);
      if (byBranch !== 0) return byBranch;
      return (left.uom_name ?? '').localeCompare(right.uom_name ?? '', 'es');
    });

  const stockedUoms = new Set(
    lines
      .filter((line) => Number(line.quantity) > 0)
      .map((line) => uomKey(line.uom_name)),
  );
  const mixed = stockedUoms.size > 1;
  const singleUom = stockedUoms.size === 1
    ? lines.find((line) => Number(line.quantity) > 0)?.uom_name ?? null
    : null;

  const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
  const costComplete = lines.every((line) => line.cost_complete);
  const knownTotals = lines
    .map((line) => (line.total_cost == null ? null : Number(line.total_cost)))
    .filter((value): value is number => value != null);
  const totalCost = !mixed && costComplete && knownTotals.length === lines.length
    ? knownTotals.reduce((sum, value) => sum + value, 0)
    : null;
  const average = !mixed && totalQuantity > 0 && totalCost != null
    ? totalCost / totalQuantity
    : !mixed && totalQuantity === 0
      ? 0
      : null;

  return {
    uom_name: mixed ? null : singleUom,
    mixed_uom: mixed,
    total_quantity: mixed ? null : formatQty(totalQuantity),
    average_unit_cost: average == null ? null : formatMarginAmount(average),
    total_cost: totalCost == null ? null : formatMarginAmount(totalCost),
    cost_complete: !mixed && costComplete,
    lines,
  };
}

function toLine(bucket: Bucket): BranchReportLine {
  const complete = bucket.quantity <= 0 || bucket.pricedQuantity + 1e-9 >= bucket.quantity;
  const average = bucket.pricedQuantity > 0 ? bucket.pricedCost / bucket.pricedQuantity : bucket.quantity <= 0 ? 0 : null;
  const total = bucket.quantity <= 0
    ? 0
    : complete && average != null
      ? average * bucket.quantity
      : bucket.pricedQuantity > 0
        ? bucket.pricedCost
        : null;

  return {
    billing_branch_id: bucket.branch.id,
    name: bucket.branch.name,
    city: bucket.branch.city,
    razon_social: bucket.branch.razon_social,
    uom_name: bucket.uomName,
    quantity: formatQty(bucket.quantity),
    average_unit_cost: average == null ? null : formatMarginAmount(average),
    total_cost: total == null ? null : formatMarginAmount(total),
    cost_complete: complete,
  };
}
