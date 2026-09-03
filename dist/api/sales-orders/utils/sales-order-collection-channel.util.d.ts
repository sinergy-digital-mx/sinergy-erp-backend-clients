import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
export declare const SALES_ORDER_COLLECTION_CHANNEL_VALUES: readonly ["pos_cobranza", "manual", "mixed"];
export type SalesOrderCollectionChannel = (typeof SALES_ORDER_COLLECTION_CHANNEL_VALUES)[number];
export declare const SALES_ORDER_COLLECTION_CHANNEL_LABELS: Record<SalesOrderCollectionChannel, string>;
export type SalesOrderCollectionChannelDisplay = {
    collection_channel: SalesOrderCollectionChannel | null;
    collection_channel_label: string | null;
};
export declare function resolveSalesOrderCollectionChannel(input: {
    hasPosCollection?: boolean;
    paymentSources?: Array<string | null | undefined>;
    inferredPosCollection?: boolean;
}): SalesOrderCollectionChannelDisplay;
export declare function mapCollectionChannelByOrderId(orders: Array<{
    id: string;
    sales_order_type?: string | null;
    collected_by_user_id?: string | null;
}>, collections: Array<{
    sales_order_id: string;
}>, payments: Array<{
    sales_order_id: string;
    source?: string | null;
}>): Map<string, SalesOrderCollectionChannelDisplay>;
export declare function applySalesOrderCollectionChannelFilter<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, orderAlias: string, channel?: SalesOrderCollectionChannel | null): void;
export declare function collectionChannelSourceLabel(source: string | null | undefined): string | null;
