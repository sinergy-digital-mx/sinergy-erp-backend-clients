export declare class RenderEmailTemplateContextDto {
    entity: 'payment' | 'contract' | 'customer' | 'lead';
    id: string;
}
export declare class RenderEmailTemplateDto {
    variables?: Record<string, unknown>;
    context?: RenderEmailTemplateContextDto;
}
export declare class PreviewEmailTemplateDto extends RenderEmailTemplateDto {
    subject?: string;
    bodyHtml: string;
}
