// src/users/dto/create-user.dto.ts
export class CreateUserDto {
    tenant_id: number;
    status_id: number;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    language_code?: string;
}
