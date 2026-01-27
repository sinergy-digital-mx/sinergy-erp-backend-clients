// src/customers/dto/create-customer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Tenant ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    tenant_id: number;

    @ApiProperty({ description: 'Customer status ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    status_id: number;

    @ApiProperty({ description: 'Customer name', example: 'Acme Corporation' })
    @IsString()
    @IsNotEmpty()
    name: string;
}