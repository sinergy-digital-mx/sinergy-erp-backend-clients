// src/users/dto/create-user.dto.ts
export class CreateUserDto {
    tenant_id: number;
    status_id: number;
    email: string;
    password: string;
}
