import { Repository } from 'typeorm';
import { EmailTemplate } from '../../entities/email-templates/email-template.entity';
import { TenantModule } from '../../entities/rbac/tenant-module.entity';
import { RBACTenant } from '../../entities/rbac/tenant.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { Contract } from '../../entities/contracts/contract.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { Lead } from '../../entities/leads/lead.entity';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { QueryEmailTemplateDto } from './dto/query-email-template.dto';
import { PreviewEmailTemplateDto, RenderEmailTemplateDto } from './dto/render-email-template.dto';
import { SendEmailTemplateDto } from './dto/send-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { MailerConfigurationService } from '../mailer-configuration/services/mailer-configuration.service';
import { AvailableEmailTemplateEntityDto } from './dto/email-template-variable.dto';
export interface RenderedEmailTemplate {
    subject: string;
    bodyHtml: string;
    missingVariables: string[];
}
export interface SentEmailTemplateResult extends RenderedEmailTemplate {
    provider: string;
    providerMessageId: string;
    toEmail: string;
    cc?: string[];
    bcc?: string[];
}
export declare class EmailTemplatesService {
    private readonly templateRepository;
    private readonly tenantModuleRepository;
    private readonly tenantRepository;
    private readonly paymentRepository;
    private readonly contractRepository;
    private readonly customerRepository;
    private readonly leadRepository;
    private readonly mailerConfigurationService;
    constructor(templateRepository: Repository<EmailTemplate>, tenantModuleRepository: Repository<TenantModule>, tenantRepository: Repository<RBACTenant>, paymentRepository: Repository<Payment>, contractRepository: Repository<Contract>, customerRepository: Repository<Customer>, leadRepository: Repository<Lead>, mailerConfigurationService: MailerConfigurationService);
    create(tenantId: string, dto: CreateEmailTemplateDto, userId: string | null): Promise<EmailTemplate>;
    findAll(tenantId: string, query: QueryEmailTemplateDto): Promise<{
        data: EmailTemplate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(tenantId: string, id: string): Promise<EmailTemplate>;
    update(tenantId: string, id: string, dto: UpdateEmailTemplateDto, userId: string | null): Promise<EmailTemplate>;
    remove(tenantId: string, id: string, userId: string | null): Promise<void>;
    getAvailableVariables(tenantId: string): Promise<AvailableEmailTemplateEntityDto[]>;
    render(tenantId: string, id: string, dto: RenderEmailTemplateDto): Promise<RenderedEmailTemplate>;
    preview(tenantId: string, dto: PreviewEmailTemplateDto): Promise<RenderedEmailTemplate>;
    send(tenantId: string, id: string, dto: SendEmailTemplateDto): Promise<SentEmailTemplateResult>;
    extractTemplateVariables(subject: string, bodyHtml: string): string[];
    private renderContent;
    private resolveVariableValue;
    private resolveRecipientEmail;
    private formatFromAddress;
    private resolveRenderVariables;
    private resolveContextVariables;
    private resolvePaymentContext;
    private resolveContractContext;
    private resolveCustomerContext;
    private resolveLeadContext;
    private getTenantVariables;
    private mapContractVariables;
    private mapCustomerVariables;
    private deepMerge;
    private normalizeAndValidateVariables;
    private ensureNameAvailable;
    private escapeHtml;
    private formatCurrency;
}
