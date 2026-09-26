import { DataSource } from 'typeorm';
export declare class CustomerDebtLedgerService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    captureCharge(input: {
        tenantId: string;
        salesOrderId: string;
        userId: string | null;
        amount?: number;
        occurredAt?: Date;
    }): Promise<void>;
    capturePayment(input: {
        tenantId: string;
        salesOrderId: string;
        paymentId: string;
        userId: string | null;
        source: string;
    }): Promise<void>;
    capturePaymentReversal(input: {
        tenantId: string;
        paymentId: string;
        userId: string | null;
    }): Promise<void>;
    captureChargeReversal(input: {
        tenantId: string;
        salesOrderId: string;
        userId: string | null;
    }): Promise<void>;
    private canCapture;
    private append;
    private insertMovement;
    private loadOrder;
    private loadPayment;
    private openAmount;
    private sumPayments;
    private hasSourceKey;
    private lockCustomer;
    private sourceExists;
    private latestCustomerBalance;
    private latestOrderBalance;
    private latestDueDate;
    private parseDate;
    private isDuplicate;
}
