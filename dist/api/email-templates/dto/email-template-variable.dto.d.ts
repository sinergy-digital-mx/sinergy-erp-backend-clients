export declare class EmailTemplateCustomVariableDto {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
    required?: boolean;
    defaultValue?: string | number | boolean | null;
}
export declare class AvailableEmailTemplateVariableDto {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
    source: string;
    description?: string;
}
export declare class AvailableEmailTemplateEntityDto {
    entity: string;
    label: string;
    moduleCode: string;
    variables: AvailableEmailTemplateVariableDto[];
}
