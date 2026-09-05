import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { SalesOrderInvoiceEmail } from '../../../entities/sales-orders/sales-order-invoice-email.entity';
import { SalesOrderInvoiceEmailTemplate } from '../../../entities/sales-orders/sales-order-invoice-email-template.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { MailerConfigurationService } from '../../mailer-configuration/services/mailer-configuration.service';
import { ElectronicInvoicePdfService } from '../../electronic-invoicing/services/electronic-invoice-pdf.service';
import { ElectronicInvoiceService } from '../../electronic-invoicing/services/electronic-invoice.service';
import { SendSalesOrderInvoiceEmailDto } from '../dto/send-sales-order-invoice-email.dto';
import { UpdateInvoiceEmailTemplateDto } from '../dto/update-invoice-email-template.dto';
export declare class SalesOrderInvoiceEmailService {
    private readonly salesOrderRepo;
    private readonly customerRepo;
    private readonly templateRepo;
    private readonly emailRepo;
    private readonly electronicInvoiceService;
    private readonly pdfService;
    private readonly mailerConfigurationService;
    constructor(salesOrderRepo: Repository<SalesOrder>, customerRepo: Repository<Customer>, templateRepo: Repository<SalesOrderInvoiceEmailTemplate>, emailRepo: Repository<SalesOrderInvoiceEmail>, electronicInvoiceService: ElectronicInvoiceService, pdfService: ElectronicInvoicePdfService, mailerConfigurationService: MailerConfigurationService);
    getTemplate(tenantId: string): Promise<{
        id: string;
        subject: string;
        body_html: string;
        variables: readonly [{
            readonly key: "customer_name";
            readonly label: "Nombre del cliente";
        }, {
            readonly key: "customer_company";
            readonly label: "Empresa del cliente";
        }, {
            readonly key: "issuer_name";
            readonly label: "Razón social emisora";
        }, {
            readonly key: "order_folio";
            readonly label: "Folio de la orden";
        }, {
            readonly key: "invoice_folio";
            readonly label: "Serie y folio de la factura";
        }, {
            readonly key: "uuid";
            readonly label: "UUID / folio fiscal";
        }, {
            readonly key: "total";
            readonly label: "Total";
        }, {
            readonly key: "subtotal";
            readonly label: "Subtotal";
        }, {
            readonly key: "stamped_at";
            readonly label: "Fecha de timbrado";
        }, {
            readonly key: "extra_message";
            readonly label: "Nota personalizada del envío";
        }];
        sample_values: Record<string, string>;
        sample_html: string;
        sample_subject: string;
        updated_at: Date;
        updated_by: {
            id: string;
            display_name: string | null;
        } | null;
    }>;
    updateTemplate(tenantId: string, userId: string, dto: UpdateInvoiceEmailTemplateDto): Promise<{
        id: string;
        subject: string;
        body_html: string;
        variables: readonly [{
            readonly key: "customer_name";
            readonly label: "Nombre del cliente";
        }, {
            readonly key: "customer_company";
            readonly label: "Empresa del cliente";
        }, {
            readonly key: "issuer_name";
            readonly label: "Razón social emisora";
        }, {
            readonly key: "order_folio";
            readonly label: "Folio de la orden";
        }, {
            readonly key: "invoice_folio";
            readonly label: "Serie y folio de la factura";
        }, {
            readonly key: "uuid";
            readonly label: "UUID / folio fiscal";
        }, {
            readonly key: "total";
            readonly label: "Total";
        }, {
            readonly key: "subtotal";
            readonly label: "Subtotal";
        }, {
            readonly key: "stamped_at";
            readonly label: "Fecha de timbrado";
        }, {
            readonly key: "extra_message";
            readonly label: "Nota personalizada del envío";
        }];
        sample_values: Record<string, string>;
        sample_html: string;
        sample_subject: string;
        updated_at: Date;
        updated_by: {
            id: string;
            display_name: string | null;
        } | null;
    }>;
    getCompose(salesOrderId: string, invoiceId: string, tenantId: string): Promise<{
        to_email: string;
        additional_email: string | null;
        customer_name: string;
        customer_company: string;
        subject: string;
        preview_html: string;
        body_html: string;
        values: Record<string, string>;
        variables: readonly [{
            readonly key: "customer_name";
            readonly label: "Nombre del cliente";
        }, {
            readonly key: "customer_company";
            readonly label: "Empresa del cliente";
        }, {
            readonly key: "issuer_name";
            readonly label: "Razón social emisora";
        }, {
            readonly key: "order_folio";
            readonly label: "Folio de la orden";
        }, {
            readonly key: "invoice_folio";
            readonly label: "Serie y folio de la factura";
        }, {
            readonly key: "uuid";
            readonly label: "UUID / folio fiscal";
        }, {
            readonly key: "total";
            readonly label: "Total";
        }, {
            readonly key: "subtotal";
            readonly label: "Subtotal";
        }, {
            readonly key: "stamped_at";
            readonly label: "Fecha de timbrado";
        }, {
            readonly key: "extra_message";
            readonly label: "Nota personalizada del envío";
        }];
        attachments: {
            kind: "pdf" | "xml";
            fileName: string;
        }[];
        can_send: boolean;
        block_reason: string | null;
    }>;
    send(salesOrderId: string, invoiceId: string, dto: SendSalesOrderInvoiceEmailDto, tenantId: string, userId: string): Promise<{
        id: string;
        invoice_id: string;
        to_email: string;
        cc: string[];
        subject: string;
        message: string | null;
        sent_at: Date;
        sent_by: {
            id: string;
            first_name: string;
            last_name: string;
            display_name: string | null;
        } | null;
    }>;
    list(salesOrderId: string, tenantId: string): Promise<{
        id: string;
        invoice_id: string;
        to_email: string;
        cc: string[];
        subject: string;
        message: string | null;
        sent_at: Date;
        sent_by: {
            id: string;
            first_name: string;
            last_name: string;
            display_name: string | null;
        } | null;
    }[]>;
    private loadSendableContext;
    private isSendable;
    private ensureTemplate;
    private buildValues;
    private sampleValues;
    private mapTemplate;
    private mapEmailRow;
    private resolveCustomerEmail;
    private secondaryCustomerEmail;
    private normalizeCc;
    private describeAttachments;
    private buildAttachments;
    private sendViaResend;
    private getSalesOrderOrFail;
    private formatMoney;
    private formatDate;
}
