import { Repository } from 'typeorm';
import { QuotationEmail } from '../../../entities/quotations/quotation-email.entity';
import { MailerConfigurationService } from '../../mailer-configuration/services/mailer-configuration.service';
import { QuotationService } from './quotation.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { SendQuotationEmailDto } from '../dto/send-quotation-email.dto';
export declare class QuotationEmailService {
    private readonly emailRepo;
    private readonly quotationService;
    private readonly pdfService;
    private readonly mailerConfigurationService;
    constructor(emailRepo: Repository<QuotationEmail>, quotationService: QuotationService, pdfService: QuotationPdfService, mailerConfigurationService: MailerConfigurationService);
    list(quotationId: string, tenantId: string): Promise<{
        id: string;
        to_email: string;
        cc: string[];
        bcc: string[];
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
    send(quotationId: string, dto: SendQuotationEmailDto, tenantId: string, userId: string): Promise<{
        id: string;
        to_email: string;
        cc: string[];
        bcc: string[];
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
    private mapRow;
    private buildEmailHtml;
    private escapeHtml;
}
