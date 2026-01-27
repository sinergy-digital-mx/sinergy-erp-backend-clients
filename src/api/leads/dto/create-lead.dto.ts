// src/leads/dto/create-lead.dto.ts
export class CreateLeadDto {
    tenant_id: number;
    status_id: number;
    name: string;
    lastname: string;
    email: string;
    phone: string;
    phone_country: string;
    phone_code: string;
    source?: string;
}
