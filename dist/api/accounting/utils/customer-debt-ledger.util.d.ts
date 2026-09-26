import { CustomerDebtLedgerMovementType } from '../../../entities/accounting/customer-debt-ledger-movement-type.enum';
export type DebtAgingBucket = 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'd91_plus';
export type DebtLedgerBalanceDraft = {
    tenantId: string;
    customerId: number;
    fiscalConfigurationId: string;
    salesOrderId: string;
    sourceKey: string;
    movementType: CustomerDebtLedgerMovementType;
    amountDelta: number;
    occurredAt: Date;
};
export type DebtLedgerBalancedDraft<T> = T & {
    balanceAfter: number;
    orderBalanceAfter: number;
};
export declare function roundDebtMoney(value: number): number;
export declare function clampDebtMoney(value: number): number;
export declare function isWalkInDebtCustomer(customer: {
    fiscal_razon_social?: string | null;
    name?: string | null;
}): boolean;
export declare function customerDebtDisplayName(customer: {
    fiscal_razon_social?: string | null;
    company_name?: string | null;
    name?: string | null;
    lastname?: string | null;
}): string;
export declare function billingBranchLabel(city?: string | null, code?: string | null): string | null;
export declare function debtDueDate(occurredAt: Date, creditDays: number | null | undefined): string;
export declare function calendarDaysPastDue(dueDate: string, asOf: Date): number;
export declare function debtAgingBucket(dueDate: string | null, asOf: Date): DebtAgingBucket;
export declare function debtPaymentMethodLabel(method: string | null | undefined): string | null;
export declare function debtMovementLabel(type: CustomerDebtLedgerMovementType | 'opening'): string;
export declare function debtMovementDescription(input: {
    movementType: CustomerDebtLedgerMovementType | 'opening';
    folio?: string | null;
    dueDate?: string | null;
    paymentMethod?: string | null;
    referenceNumber?: string | null;
}): string;
export declare function formatDebtDay(value: string): string;
export declare function applyDebtLedgerBalances<T extends DebtLedgerBalanceDraft>(drafts: T[]): Array<DebtLedgerBalancedDraft<T>>;
export declare function chargeSourceKey(salesOrderId: string): string;
export declare function paymentSourceKey(paymentId: string): string;
export declare function chargeReversalSourceKey(salesOrderId: string): string;
export declare function paymentReversalSourceKey(paymentId: string): string;
