import { mapBatchMeasure } from '../../inventory/utils/inventory-measure.util';

export type PurchaseOrderLotOrigin = 'receipt' | 'migration';

export type PurchaseOrderLotTransferInfo = {
  transfer_id: string;
  transfer_folio: string;
  quantity: string;
  transferred_at: Date;
  transferred_by_name: string | null;
  source_warehouse_name: string | null;
  source_sucursal: string | null;
  destination_warehouse_name: string | null;
  destination_sucursal: string | null;
};

export type PurchaseOrderLotNode = {
  id: string;
  batch_number: string;
  origin: PurchaseOrderLotOrigin;
  origin_label: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  fiscal_configuration_id: string | null;
  razon_social: string | null;
  billing_branch_id: string | null;
  sucursal: string | null;
  uom_id: string;
  uom_name: string;
  measure: string | null;
  measure_uom_id: string | null;
  measure_uom_name: string | null;
  measure_label: string | null;
  source_tag_identifier: string | null;
  unit_cost: number;
  real_unit_cost_usd: number | null;
  real_unit_cost_mxn: number | null;
  amount: number;
  ordered_quantity: string | null;
  received_quantity: string;
  remaining_quantity: string;
  migrated_quantity: string;
  consumed_quantity: string;
  created_at: Date;
  created_by: string;
  created_by_name: string | null;
  transfer: PurchaseOrderLotTransferInfo | null;
  migrated_to: PurchaseOrderLotNode[];
};

export type PurchaseOrderLotsSummary = {
  received_lots: number;
  migrated_lots: number;
  received_quantity: string;
  remaining_on_received_lots: string;
  remaining_total: string;
  migrated_quantity: string;
  amount_total: number;
};

export type PurchaseOrderLotTreeInput = {
  id: string;
  batch_number: string;
  transferred_from_batch_id: string | null;
  purchase_order_detail_id: string | null;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  fiscal_configuration_id: string | null;
  razon_social: string | null;
  billing_branch_id: string | null;
  sucursal: string | null;
  uom_id: string;
  uom_name: string;
  measure?: unknown;
  measure_uom_id?: string | null;
  measure_uom_name?: string | null;
  source_tag_identifier?: string | null;
  initial_quantity: number | string;
  available_quantity: number | string;
  created_at: Date;
  created_by: string;
  created_by_name: string | null;
};

export type PurchaseOrderLotLineInput = {
  id: string;
  quantity: number | string;
  unit_total: number | string;
  received_original_unit_total?: number | string | null;
  real_unit_cost_usd?: number | string | null;
  real_unit_cost_mxn?: number | string | null;
};

export type PurchaseOrderLotTransferInput = {
  id: string;
  folio: string;
  quantity: number | string;
  source_inventory_batch_id: string;
  destination_inventory_batch_id: string;
  created_at: Date;
  created_by_name: string | null;
  source_warehouse_name: string | null;
  source_sucursal: string | null;
  destination_warehouse_name: string | null;
  destination_sucursal: string | null;
};

function toQty(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatQty(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(3);
}

function roundQty(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function optionalUnitCost(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unitCostFromLine(line?: PurchaseOrderLotLineInput): number {
  if (!line) {
    return 0;
  }
  const received = line.received_original_unit_total;
  if (received !== undefined && received !== null && received !== '') {
    const parsed = Number(received);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  const requested = Number(line.unit_total);
  return Number.isFinite(requested) ? requested : 0;
}

function countByOrigin(
  nodes: PurchaseOrderLotNode[],
  origin: PurchaseOrderLotOrigin,
): number {
  return nodes.reduce((sum, node) => {
    const self = node.origin === origin ? 1 : 0;
    return sum + self + countByOrigin(node.migrated_to, origin);
  }, 0);
}

function sumQty(
  nodes: PurchaseOrderLotNode[],
  pick: (node: PurchaseOrderLotNode) => number,
): number {
  return nodes.reduce((sum, node) => sum + pick(node) + sumQty(node.migrated_to, pick), 0);
}

export function buildPurchaseOrderLotTree(
  batches: PurchaseOrderLotTreeInput[],
  lines: PurchaseOrderLotLineInput[],
  transfers: PurchaseOrderLotTransferInput[],
): { batches: PurchaseOrderLotNode[]; summary: PurchaseOrderLotsSummary } {
  const lineById = new Map(lines.map((line) => [line.id, line]));
  const batchIds = new Set(batches.map((batch) => batch.id));
  const childrenByParent = new Map<string, string[]>();
  const roots: string[] = [];

  for (const batch of batches) {
    const parentId = batch.transferred_from_batch_id;
    if (parentId && batchIds.has(parentId)) {
      const siblings = childrenByParent.get(parentId) ?? [];
      siblings.push(batch.id);
      childrenByParent.set(parentId, siblings);
    } else {
      roots.push(batch.id);
    }
  }

  const outboundBySource = new Map<string, number>();
  const inboundByDest = new Map<string, PurchaseOrderLotTransferInput[]>();
  for (const transfer of transfers) {
    outboundBySource.set(
      transfer.source_inventory_batch_id,
      roundQty(
        (outboundBySource.get(transfer.source_inventory_batch_id) ?? 0) +
          toQty(transfer.quantity),
      ),
    );
    const inbound = inboundByDest.get(transfer.destination_inventory_batch_id) ?? [];
    inbound.push(transfer);
    inboundByDest.set(transfer.destination_inventory_batch_id, inbound);
  }

  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const visiting = new Set<string>();

  const mapNode = (id: string): PurchaseOrderLotNode => {
    const batch = batchById.get(id);
    if (!batch) {
      throw new Error(`Lote no encontrado en el árbol: ${id}`);
    }
    if (visiting.has(id)) {
      return buildLeaf(batch, [], outboundBySource, inboundByDest, lineById);
    }
    visiting.add(id);
    const childIds = childrenByParent.get(id) ?? [];
    const children = childIds.map((childId) => mapNode(childId));
    visiting.delete(id);
    return buildLeaf(batch, children, outboundBySource, inboundByDest, lineById);
  };

  const tree = roots.map((id) => mapNode(id));
  const receivedNodes = tree.filter((node) => node.origin === 'receipt');
  const amountTotal = roundMoney(
    receivedNodes.reduce((sum, node) => sum + node.amount, 0),
  );

  return {
    batches: tree,
    summary: {
      received_lots: receivedNodes.length,
      migrated_lots: countByOrigin(tree, 'migration'),
      received_quantity: formatQty(
        receivedNodes.reduce((sum, node) => sum + toQty(node.received_quantity), 0),
      ),
      remaining_on_received_lots: formatQty(
        receivedNodes.reduce((sum, node) => sum + toQty(node.remaining_quantity), 0),
      ),
      remaining_total: formatQty(sumQty(tree, (node) => toQty(node.remaining_quantity))),
      migrated_quantity: formatQty(
        receivedNodes.reduce((sum, node) => sum + toQty(node.migrated_quantity), 0),
      ),
      amount_total: amountTotal,
    },
  };
}

function buildLeaf(
  batch: PurchaseOrderLotTreeInput,
  children: PurchaseOrderLotNode[],
  outboundBySource: Map<string, number>,
  inboundByDest: Map<string, PurchaseOrderLotTransferInput[]>,
  lineById: Map<string, PurchaseOrderLotLineInput>,
): PurchaseOrderLotNode {
  const origin: PurchaseOrderLotOrigin = batch.transferred_from_batch_id
    ? 'migration'
    : 'receipt';
  const initial = toQty(batch.initial_quantity);
  const available = toQty(batch.available_quantity);
  const migratedOut = outboundBySource.get(batch.id) ?? 0;
  const consumed = Math.max(0, roundQty(initial - available - migratedOut));
  const line = batch.purchase_order_detail_id
    ? lineById.get(batch.purchase_order_detail_id)
    : undefined;
  const unitCost = unitCostFromLine(line);
  const qtyForAmount = origin === 'receipt' ? initial : initial;
  const inbound = inboundByDest.get(batch.id)?.[0] ?? null;
  const measure = mapBatchMeasure(batch);

  return {
    id: batch.id,
    batch_number: batch.batch_number,
    origin,
    origin_label: origin === 'receipt' ? 'Recibido' : 'Migrado a',
    product_id: batch.product_id,
    product_name: batch.product_name,
    product_sku: batch.product_sku,
    warehouse_id: batch.warehouse_id,
    warehouse_name: batch.warehouse_name,
    fiscal_configuration_id: batch.fiscal_configuration_id,
    razon_social: batch.razon_social,
    billing_branch_id: batch.billing_branch_id,
    sucursal: batch.sucursal,
    uom_id: batch.uom_id,
    uom_name: batch.uom_name,
    measure: measure.measure,
    measure_uom_id: measure.measure_uom_id,
    measure_uom_name: measure.measure_uom_name,
    measure_label: measure.measure_label,
    source_tag_identifier: batch.source_tag_identifier ?? null,
    unit_cost: unitCost,
    real_unit_cost_usd: optionalUnitCost(line?.real_unit_cost_usd),
    real_unit_cost_mxn: optionalUnitCost(line?.real_unit_cost_mxn),
    amount: roundMoney(unitCost * qtyForAmount),
    ordered_quantity: origin === 'receipt' && line ? formatQty(toQty(line.quantity)) : null,
    received_quantity: formatQty(initial),
    remaining_quantity: formatQty(available),
    migrated_quantity: formatQty(migratedOut),
    consumed_quantity: formatQty(consumed),
    created_at: batch.created_at,
    created_by: batch.created_by,
    created_by_name: batch.created_by_name,
    transfer: inbound
      ? {
          transfer_id: inbound.id,
          transfer_folio: inbound.folio,
          quantity: formatQty(toQty(inbound.quantity)),
          transferred_at: inbound.created_at,
          transferred_by_name: inbound.created_by_name,
          source_warehouse_name: inbound.source_warehouse_name,
          source_sucursal: inbound.source_sucursal,
          destination_warehouse_name: inbound.destination_warehouse_name,
          destination_sucursal: inbound.destination_sucursal,
        }
      : null,
    migrated_to: children,
  };
}
