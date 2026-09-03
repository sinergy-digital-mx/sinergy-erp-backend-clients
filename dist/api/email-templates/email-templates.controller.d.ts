import { TenantContextService } from '../rbac/services/tenant-context.service';
import { EmailTemplatesService, RenderedEmailTemplate } from './email-templates.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { QueryEmailTemplateDto } from './dto/query-email-template.dto';
import { PreviewEmailTemplateDto, RenderEmailTemplateDto } from './dto/render-email-template.dto';
import { SendEmailTemplateDto } from './dto/send-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplate } from '../../entities/email-templates/email-template.entity';
import { AvailableEmailTemplateEntityDto } from './dto/email-template-variable.dto';
import { SentEmailTemplateResult } from './email-templates.service';
export declare class EmailTemplatesController {
    private readonly service;
    private readonly tenantContext;
    constructor(service: EmailTemplatesService, tenantContext: TenantContextService);
    create(dto: CreateEmailTemplateDto): Promise<EmailTemplate>;
    findAll(query: QueryEmailTemplateDto): Promise<{
        data: EmailTemplate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAvailableVariables(): Promise<AvailableEmailTemplateEntityDto[]>;
    preview(dto: PreviewEmailTemplateDto): Promise<RenderedEmailTemplate>;
    findOne(id: string): Promise<EmailTemplate>;
    update(id: string, dto: UpdateEmailTemplateDto): Promise<EmailTemplate>;
    remove(id: string): Promise<void>;
    render(id: string, dto: RenderEmailTemplateDto): Promise<RenderedEmailTemplate>;
    send(id: string, dto: SendEmailTemplateDto): Promise<SentEmailTemplateResult>;
    private requireTenantContext;
}
