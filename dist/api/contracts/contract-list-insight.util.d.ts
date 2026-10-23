import { EntityManager, SelectQueryBuilder } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
export type ContractPaymentPhase = 'down_payment' | 'contract';
export type NextPaymentKind = 'down_payment' | 'contract';
export type NextPaymentCandidate = {
    due_date: Date | string | null;
    status: string | null;
    payment_number: string | null;
    amount: number | null;
};
export type OverdueBucket = {
    contracts_count: number;
    payments_count: number;
    value: number;
};
export type ContractOverdueStats = OverdueBucket & {
    contract: OverdueBucket;
    down_payment: OverdueBucket;
};
export declare function emptyOverdueBucket(): OverdueBucket;
export declare function parseOverdueBucket(row?: {
    contracts_count?: string | number | null;
    payments_count?: string | number | null;
    value?: string | number | null;
} | null): OverdueBucket;
export declare function mergeOverdueBuckets(contract: OverdueBucket, downPayment: OverdueBucket, uniqueContractsCount: number): ContractOverdueStats;
export declare function isInDownPaymentPhase(params: {
    downPaymentFinanced: boolean;
    unpaidDownPaymentCount: number;
    downPaymentApplied: number;
    downPaymentTarget: number | null;
}): boolean;
export declare function mapNextPaymentRow(row?: {
    due_date?: Date | string | null;
    status?: string | null;
    payment_number?: string | null;
    amount?: number | string | null;
    amount_pending?: number | string | null;
} | null): NextPaymentCandidate | null;
export declare function resolveListPaymentInsight(params: {
    downPaymentFinanced: boolean;
    unpaidDownPaymentCount: number;
    downPaymentApplied: number;
    downPaymentTarget: number | null;
    contractNext: NextPaymentCandidate | null;
    downPaymentNext: NextPaymentCandidate | null;
}): {
    payment_phase: ContractPaymentPhase;
    next_payment_kind: NextPaymentKind | null;
    next_payment_is_last_down_payment: boolean;
    next_payment: NextPaymentCandidate | null;
};
export declare function loadListPaymentInsightMaps(manager: EntityManager, tenantId: string, contractIds: string[]): Promise<{
    contractNext: Map<string, NextPaymentCandidate>;
    downPaymentNext: Map<string, NextPaymentCandidate>;
    unpaidDownCount: Map<string, number>;
    overdueContractCount: Map<string, number>;
    overdueDownCount: Map<string, number>;
}>;
export declare function applyOverduePaymentsJoin(query: SelectQueryBuilder<Contract>, table: 'contract_payments' | 'contract_downpayment_payments', alias: string, dateColumn: 'payment_date' | 'due_date', statusesParam?: string): SelectQueryBuilder<Contract>;
export declare function loadFilteredOverdueStats(baseQuery: () => SelectQueryBuilder<Contract>): Promise<ContractOverdueStats>;
