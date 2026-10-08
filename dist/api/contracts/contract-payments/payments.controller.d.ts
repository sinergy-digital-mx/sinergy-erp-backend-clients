import { TenantContextService } from '../../rbac/services/tenant-context.service';
import { PaymentsService } from './payments.service';
import { PaymentReceiptService } from './payment-receipt.service';
import { RecordPartialPaymentDto } from '../dto/record-partial-payment.dto';
import { GenerateContractPaymentsDto } from './dto/generate-contract-payments.dto';
export declare class PaymentsController {
    private paymentsService;
    private paymentReceiptService;
    private tenantContext;
    constructor(paymentsService: PaymentsService, paymentReceiptService: PaymentReceiptService, tenantContext: TenantContextService);
    generatePayments(contractId: string, dto: GenerateContractPaymentsDto | undefined, req: any): Promise<import("./payments.service").GeneratedPaymentsResult>;
    regeneratePayments(contractId: string, dto: GenerateContractPaymentsDto | undefined, req: any): Promise<import("./payments.service").GeneratedPaymentsResult>;
    getPayments(contractId: string, req: any): Promise<any[]>;
    getStats(contractId: string, req: any): Promise<any>;
    previewSchedule(contractId: string, startDate: string | undefined): Promise<import("./payments.service").PaymentSchedulePreview>;
    getReceiptTemplate(): Promise<{
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
            readonly key: "cadastral_key";
            readonly label: "Clave catastral";
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
    updateReceiptTemplate(body: {
        subject?: string;
        body_html?: string;
        reset_default?: boolean;
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
            readonly key: "cadastral_key";
            readonly label: "Clave catastral";
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
    downloadReceipt(contractId: string, paymentId: string, res: any): Promise<void>;
    composeReceipt(contractId: string, paymentId: string): Promise<{
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
            cadastral_key: string;
            cadastral_line: string;
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
    sendReceipt(contractId: string, paymentId: string, body: {
        to_email?: string;
        cc?: string[];
        extra_message?: string;
    }): Promise<{
        sent: boolean;
        to_email: string;
    }>;
    getPayment(contractId: string, paymentId: string, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment | null>;
    updatePayment(contractId: string, paymentId: string, body: {
        amount_paid?: number;
        due_date?: Date;
        paid_date?: Date;
        payment_method?: string;
        reference_number?: string;
        notes?: string;
    }, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    recordPayment(contractId: string, paymentId: string, dto: RecordPartialPaymentDto, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    cancelPayment(contractId: string, paymentId: string, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    resetPayment(contractId: string, paymentId: string, req: any): Promise<import("../../../entities/contracts/payment.entity").Payment>;
    deletePayment(contractId: string, paymentId: string, req: any): Promise<{
        message: string;
    }>;
    markOverduePayments(contractId: string, req: any): Promise<{
        message: string;
        updated_count: number;
    }>;
    private requireOrganizationId;
}
