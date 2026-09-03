import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { Payment } from '../../entities/contracts/payment.entity';
export declare class ContractPdfService {
    private contractRepo;
    private paymentRepo;
    constructor(contractRepo: Repository<Contract>, paymentRepo: Repository<Payment>);
    generateContractPdf(tenantId: string, contractId: string): Promise<Buffer>;
    private formatMoney;
    private formatDate;
    private getStatusColor;
    private getPaymentStatusText;
    private getPaymentStatusColor;
}
