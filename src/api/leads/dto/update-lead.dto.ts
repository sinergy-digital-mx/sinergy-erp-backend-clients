// src/leads/dto/update-lead.dto.ts
export class UpdateLeadDto {
    status_id?: number;
    name?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    phone_country?: string;
    phone_code?: string;
    source?: string;
}
