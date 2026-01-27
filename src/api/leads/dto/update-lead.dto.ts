// src/leads/dto/update-lead.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';

export class UpdateLeadDto {
    @ApiProperty({ description: 'Lead status ID', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    status_id?: number;

    @ApiProperty({ description: 'Lead first name', example: 'John', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Lead last name', example: 'Doe', required: false })
    @IsString()
    @IsOptional()
    lastname?: string;

    @ApiProperty({ description: 'Lead email address', example: 'john.doe@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ description: 'Lead phone number', example: '+1234567890', required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ description: 'Phone country', example: 'US', required: false })
    @IsString()
    @IsOptional()
    phone_country?: string;

    @ApiProperty({ description: 'Phone country code', example: '+1', required: false })
    @IsString()
    @IsOptional()
    phone_code?: string;

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
