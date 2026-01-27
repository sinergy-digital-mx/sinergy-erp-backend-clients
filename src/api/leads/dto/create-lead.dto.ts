// src/leads/dto/create-lead.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class CreateLeadDto {
    @ApiProperty({ description: 'Tenant ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    tenant_id: number;

    @ApiProperty({ description: 'Lead status ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    status_id: number;

    @ApiProperty({ description: 'Lead first name', example: 'John' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Lead last name', example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastname: string;

    @ApiProperty({ description: 'Lead email address', example: 'john.doe@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Lead phone number', example: '+1234567890' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ description: 'Phone country', example: 'US' })
    @IsString()
    @IsNotEmpty()
    phone_country: string;

    @ApiProperty({ description: 'Phone country code', example: '+1' })
    @IsString()
    @IsNotEmpty()
    phone_code: string;

    @ApiProperty({ description: 'Lead source', example: 'Website', required: false })
    @IsString()
    @IsOptional()
    source?: string;

    @ApiProperty({ description: 'Company name', example: 'Acme Corporation', required: false })
    @IsString()
    @IsOptional()
    company_name?: string;

    @ApiProperty({ description: 'Company phone number', example: '+1234567890', required: false })
    @IsString()
    @IsOptional()
    company_phone?: string;

    @ApiProperty({ description: 'Company website', example: 'https://example.com', required: false })
    @IsString()
    @IsOptional()
    website?: string;
}
