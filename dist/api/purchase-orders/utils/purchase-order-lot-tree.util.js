"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPurchaseOrderLotTree = buildPurchaseOrderLotTree;
const inventory_measure_util_1 = require("../../inventory/utils/inventory-measure.util");
function toQty(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function formatQty(value) {
    return (Number.isFinite(value) ? value : 0).toFixed(3);
}
function roundQty(value) {
    return Math.round(value * 1000) / 1000;
}
function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
function optionalUnitCost(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}
function unitCostFromLine(line) {
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
function countByOrigin(nodes, origin) {
    return nodes.reduce((sum, node) => {
        const self = node.origin === origin ? 1 : 0;
        return sum + self + countByOrigin(node.migrated_to, origin);
    }, 0);
}
function sumQty(nodes, pick) {
    return nodes.reduce((sum, node) => sum + pick(node) + sumQty(node.migrated_to, pick), 0);
}
function buildPurchaseOrderLotTree(batches, lines, transfers) {
    const lineById = new Map(lines.map((line) => [line.id, line]));
    const batchIds = new Set(batches.map((batch) => batch.id));
    const childrenByParent = new Map();
    const roots = [];
    for (const batch of batches) {
        const parentId = batch.transferred_from_batch_id;
        if (parentId && batchIds.has(parentId)) {
            const siblings = childrenByParent.get(parentId) ?? [];
            siblings.push(batch.id);
            childrenByParent.set(parentId, siblings);
        }
        else {
            roots.push(batch.id);
        }
    }
    const outboundBySource = new Map();
    const inboundByDest = new Map();
    for (const transfer of transfers) {
        outboundBySource.set(transfer.source_inventory_batch_id, roundQty((outboundBySource.get(transfer.source_inventory_batch_id) ?? 0) +
            toQty(transfer.quantity)));
        const inbound = inboundByDest.get(transfer.destination_inventory_batch_id) ?? [];
        inbound.push(transfer);
        inboundByDest.set(transfer.destination_inventory_batch_id, inbound);
    }
    const batchById = new Map(batches.map((batch) => [batch.id, batch]));
    const visiting = new Set();
    const mapNode = (id) => {
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
    const amountTotal = roundMoney(receivedNodes.reduce((sum, node) => sum + node.amount, 0));
    return {
        batches: tree,
        summary: {
            received_lots: receivedNodes.length,
            migrated_lots: countByOrigin(tree, 'migration'),
            received_quantity: formatQty(receivedNodes.reduce((sum, node) => sum + toQty(node.received_quantity), 0)),
            remaining_on_received_lots: formatQty(receivedNodes.reduce((sum, node) => sum + toQty(node.remaining_quantity), 0)),
            remaining_total: formatQty(sumQty(tree, (node) => toQty(node.remaining_quantity))),
            migrated_quantity: formatQty(receivedNodes.reduce((sum, node) => sum + toQty(node.migrated_quantity), 0)),
            amount_total: amountTotal,
        },
    };
}
function buildLeaf(batch, children, outboundBySource, inboundByDest, lineById) {
    const origin = batch.transferred_from_batch_id
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
    const measure = (0, inventory_measure_util_1.mapBatchMeasure)(batch);
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
//# sourceMappingURL=purchase-order-lot-tree.util.js.map