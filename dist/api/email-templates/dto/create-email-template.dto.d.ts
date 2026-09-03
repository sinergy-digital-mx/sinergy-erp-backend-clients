import { EmailTemplateCustomVariableDto } from './email-template-variable.dto';
export declare class CreateEmailTemplateDto {
    name: string;
    subject: string;
    bodyHtml: string;
    variables?: string[];
    customVariables?: EmailTemplateCustomVariableDto[];
    isActive?: boolean;
}
