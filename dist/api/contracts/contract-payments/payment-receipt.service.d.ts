import { Repository } from 'typeorm';
import { Payment } from '../../../entities/contracts/payment.entity';
import { ContractDownpaymentPayment } from '../../../entities/contracts/contract-downpayment-payment.entity';
import { S3Service } from '../../../common/services/s3.service';
import { EmailTemplate } from '../../../entities/email-templates/email-template.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { RBACTenant } from '../../../entities/rbac/tenant.entity';
import { MailerConfigurationService } from '../../mailer-configuration/services/mailer-configuration.service';
export type ReceiptKind = 'payment' | 'downpayment';
export declare class PaymentReceiptService {
    private readonly paymentRepo;
    private readonly downpaymentRepo;
    private readonly templateRepo;
    private readonly fiscalRepo;
    private readonly tenantRepo;
    private readonly mailerConfigurationService;
    private readonly s3Service;
    constructor(paymentRepo: Repository<Payment>, downpaymentRepo: Repository<ContractDownpaymentPayment>, templateRepo: Repository<EmailTemplate>, fiscalRepo: Repository<FiscalConfiguration>, tenantRepo: Repository<RBACTenant>, mailerConfigurationService: MailerConfigurationService, s3Service: S3Service);
    getTemplate(organizationId: string): Promise<{
        id: string;
        subject: string;
        body_html: string;
        fiscal_configuration_id: string | null;
        fiscal_configurations: {
            id: string;
            razon_social: string;
            rfc: string;
            has_logo: boolean;
        }[];
        variables: readonly [{
            readonly key: "organization_name";
            readonly label: "Razón social";
        }, {
            readonly key: "organization_rfc";
            readonly label: "RFC";
        }, {
            readonly key: "customer_name";
            readonly label: "Cliente";
        }, {
            readonly key: "contract_number";
            readonly label: "Contrato";
        }, {
            readonly key: "property_code";
            readonly label: "Lote";
        }, {
            readonly key: "payment_number";
            readonly label: "Número de pago";
        }, {
            readonly key: "amount_paid";
            readonly label: "Monto pagado";
        }, {
            readonly key: "amount";
            readonly label: "Monto del pago";
        }, {
            readonly key: "amount_pending";
            readonly label: "Saldo del pago";
        }, {
            readonly key: "payment_date";
            readonly label: "Fecha de pago";
        }, {
            readonly key: "due_date";
            readonly label: "Fecha límite";
        }, {
            readonly key: "payment_method";
            readonly label: "Forma de pago";
        }, {
            readonly key: "status";
            readonly label: "Estado";
        }, {
            readonly key: "extra_message";
            readonly label: "Nota del envío";
        }];
        sample_subject: string;
        sample_html: string;
    }>;
    updateTemplate(organizationId: string, dto: {
        subject?: string;
        body_html?: string;
        reset_default?: boolean;
        fiscal_configuration_id?: string | null;
    }): Promise<{
        id: string;
        subject: string;
        body_html: string;
        fiscal_configuration_id: string | null;
        fiscal_configurations: {
            id: string;
            razon_social: string;
            rfc: string;
            has_logo: boolean;
        }[];
        variables: readonly [{
            readonly key: "organization_name";
            readonly label: "Razón social";
        }, {
            readonly key: "organization_rfc";
            readonly label: "RFC";
        }, {
            readonly key: "customer_name";
            readonly label: "Cliente";
        }, {
            readonly key: "contract_number";
            readonly label: "Contrato";
        }, {
            readonly key: "property_code";
            readonly label: "Lote";
        }, {
            readonly key: "payment_number";
            readonly label: "Número de pago";
        }, {
            readonly key: "amount_paid";
            readonly label: "Monto pagado";
        }, {
            readonly key: "amount";
            readonly label: "Monto del pago";
        }, {
            readonly key: "amount_pending";
            readonly label: "Saldo del pago";
        }, {
            readonly key: "payment_date";
            readonly label: "Fecha de pago";
        }, {
            readonly key: "due_date";
            readonly label: "Fecha límite";
        }, {
            readonly key: "payment_method";
            readonly label: "Forma de pago";
        }, {
            readonly key: "status";
            readonly label: "Estado";
        }, {
            readonly key: "extra_message";
            readonly label: "Nota del envío";
        }];
        sample_subject: string;
        sample_html: string;
    }>;
    compose(organizationId: string, contractId: string, paymentId: string, extraMessage?: string, kind?: ReceiptKind): Promise<{
        to_email: string;
        additional_email: string | null;
        customer_name: string;
        subject: string;
        preview_html: string;
        body_html: string;
        values: {
            organization_name: string;
            organization_rfc: string;
            customer_name: string;
            contract_number: string;
            property_code: string;
            lot_phrase: string;
            payment_number: string;
            amount_paid: string;
            amount_words: string;
            amount: string;
            amount_pending: string;
            payment_date: string;
            due_date: string;
            payment_method: string;
            concept: string;
            status: string;
            extra_message: string;
        };
        attachment_name: string;
    }>;
    pdf(organizationId: string, contractId: string, paymentId: string, kind?: ReceiptKind): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    send(organizationId: string, contractId: string, paymentId: string, dto: {
        to_email?: string;
        cc?: string[];
        extra_message?: string;
    }, kind?: ReceiptKind): Promise<{
        sent: boolean;
        to_email: string;
    }>;
    private ensureTemplate;
    private loadPayment;
    private buildValues;
    private sampleValues;
    private buildPdf;
    private fileName;
    private money;
    private formatLongDate;
    private formatDate;
    private wrapNote;
    private readFiscalId;
    private fiscalOptions;
    private resolveFiscal;
    private loadLogo;
    private sendViaResend;
}
