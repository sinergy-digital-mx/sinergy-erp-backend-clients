"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS = exports.SALES_ORDER_COLLECTION_CHANNEL_VALUES = void 0;
exports.resolveSalesOrderCollectionChannel = resolveSalesOrderCollectionChannel;
exports.mapCollectionChannelByOrderId = mapCollectionChannelByOrderId;
exports.applySalesOrderCollectionChannelFilter = applySalesOrderCollectionChannelFilter;
exports.collectionChannelSourceLabel = collectionChannelSourceLabel;
exports.SALES_ORDER_COLLECTION_CHANNEL_VALUES = [
    'pos_cobranza',
    'manual',
    'mixed',
];
exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS = {
    pos_cobranza: 'POS cobranza',
    manual: 'Cobrada manual',
    mixed: 'POS cobranza + Manual',
};
const POS_COLLECTION_TABLE = 'pos_sale_collections';
const PAYMENT_TABLE = 'inv_s_sales_order_payments';
function hasSource(sources, expected) {
    return sources.some((source) => source === expected);
}
function resolveSalesOrderCollectionChannel(input) {
    const sources = input.paymentSources ?? [];
    const hasExplicitPos = !!input.hasPosCollection || hasSource(sources, 'pos_cobranza');
    const hasManual = hasSource(sources, 'manual');
    const inferred = !!input.inferredPosCollection && !hasExplicitPos && sources.length === 0;
    const hasPos = hasExplicitPos || inferred;
    if (hasPos && hasManual) {
        return {
            collection_channel: 'mixed',
            collection_channel_label: exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS.mixed,
        };
    }
    if (hasPos) {
        return {
            collection_channel: 'pos_cobranza',
            collection_channel_label: exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS.pos_cobranza,
        };
    }
    if (hasManual) {
        return {
            collection_channel: 'manual',
            collection_channel_label: exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS.manual,
        };
    }
    return { collection_channel: null, collection_channel_label: null };
}
function mapCollectionChannelByOrderId(orders, collections, payments) {
    const collectionIds = new Set(collections.map((row) => row.sales_order_id));
    const sourcesByOrder = new Map();
    for (const payment of payments) {
        const list = sourcesByOrder.get(payment.sales_order_id) ?? [];
        list.push(payment.source);
        sourcesByOrder.set(payment.sales_order_id, list);
    }
    const result = new Map();
    for (const order of orders) {
        result.set(order.id, resolveSalesOrderCollectionChannel({
            hasPosCollection: collectionIds.has(order.id),
            paymentSources: sourcesByOrder.get(order.id) ?? [],
            inferredPosCollection: order.sales_order_type === 'POS' && !!order.collected_by_user_id,
        }));
    }
    return result;
}
function applySalesOrderCollectionChannelFilter(qb, orderAlias, channel) {
    if (!channel)
        return;
    const orderId = `${orderAlias}.id`;
    const tenantId = `${orderAlias}.tenant_id`;
    const hasPos = `(
    EXISTS (
      SELECT 1 FROM ${POS_COLLECTION_TABLE} c
      WHERE c.sales_order_id = ${orderId} AND c.tenant_id = ${tenantId}
    )
    OR EXISTS (
      SELECT 1 FROM ${PAYMENT_TABLE} p
      WHERE p.sales_order_id = ${orderId}
        AND p.tenant_id = ${tenantId}
        AND p.source = 'pos_cobranza'
    )
    OR (
      ${orderAlias}.sales_order_type = 'POS'
      AND ${orderAlias}.collected_by_user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM ${PAYMENT_TABLE} p2
        WHERE p2.sales_order_id = ${orderId} AND p2.tenant_id = ${tenantId}
      )
      AND NOT EXISTS (
        SELECT 1 FROM ${POS_COLLECTION_TABLE} c2
        WHERE c2.sales_order_id = ${orderId} AND c2.tenant_id = ${tenantId}
      )
    )
  )`;
    const hasManual = `EXISTS (
    SELECT 1 FROM ${PAYMENT_TABLE} p
    WHERE p.sales_order_id = ${orderId}
      AND p.tenant_id = ${tenantId}
      AND p.source = 'manual'
  )`;
    if (channel === 'pos_cobranza') {
        qb.andWhere(`${hasPos} AND NOT (${hasManual})`);
        return;
    }
    if (channel === 'manual') {
        qb.andWhere(`${hasManual} AND NOT (${hasPos})`);
        return;
    }
    qb.andWhere(`${hasPos} AND ${hasManual}`);
}
function collectionChannelSourceLabel(source) {
    if (source === 'pos_cobranza') {
        return exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS.pos_cobranza;
    }
    if (source === 'manual') {
        return exports.SALES_ORDER_COLLECTION_CHANNEL_LABELS.manual;
    }
    return null;
}
//# sourceMappingURL=sales-order-collection-channel.util.js.map