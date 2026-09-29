import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { ContractDownpaymentPayment } from '../../entities/contracts/contract-downpayment-payment.entity';
export declare class ContractPdfService {
    private contractRepo;
    private paymentRepo;
    private downpaymentRepo;
    constructor(contractRepo: Repository<Contract>, paymentRepo: Repository<Payment>, downpaymentRepo: Repository<ContractDownpaymentPayment>);
    generateContractPdf(tenantId: string, contractId: string): Promise<Buffer>;
    private infoBlock;
    private summaryBlock;
    private fact;
    private sectionTitle;
    private emptyLine;
    private paymentsTable;
    private cell;
    private bandLayout;
    private toStatementRow;
    private formatMoney;
    private formatDate;
    private formatDateTime;
    private statusLabel;
    private paymentStatusLabel;
    private methodLabel;
}
