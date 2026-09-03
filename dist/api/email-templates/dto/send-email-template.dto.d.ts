import { RenderEmailTemplateContextDto } from './render-email-template.dto';
export declare class SendEmailTemplateDto {
    context?: RenderEmailTemplateContextDto;
    variables?: Record<string, unknown>;
    toEmail?: string;
    cc?: string[];
    bcc?: string[];
    note?: string;
}
