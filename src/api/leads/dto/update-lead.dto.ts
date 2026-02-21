// src/leads/dto/update-lead.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail, IsBoolean } from 'class-validator';
import { IsPhone } from '../../../common/decorators/is-phone.decorator';

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

    @ApiProperty({ 
        description: 'Lead phone number in E.164 format. Must include country code. Examples: +1 2025551234 (USA), +52 6647945661 (Mexico), +44 2071838750 (UK)', 
        example: '+52 6647945661', 
        required: false
    })
    @IsPhone()
    @IsOptional()
    phone?: string;

    @ApiProperty({ description: 'Phone country', example: 'Mexico', required: false })
    @IsString()
    @IsOptional()
    phone_country?: string;

    @ApiProperty({ description: 'Phone country code', example: '+52', required: false })
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

    @ApiProperty({ 
        description: 'Company phone number in E.164 format. Must include country code. Examples: +1 2025551234 (USA), +52 6647945661 (Mexico), +44 2071838750 (UK)', 
        example: '+52 6647945661', 
        required: false 
    })
    @IsPhone()
    @IsOptional()
    company_phone?: string;

    @ApiProperty({ description: 'Company website', example: 'https://example.com', required: false })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiProperty({ description: 'Whether lead was contacted via email', example: true, required: false })
    @IsBoolean()
    @IsOptional()
    email_contacted?: boolean;

    @ApiProperty({ description: 'Whether customer has responded', example: true, required: false })
    @IsBoolean()
    @IsOptional()
    customer_answered?: boolean;

    @ApiProperty({ description: 'Whether agent has replied back to customer', example: true, required: false })
    @IsBoolean()
    @IsOptional()
    agent_replied_back?: boolean;

    @ApiProperty({ description: 'Lead group ID', example: 'uuid-here', required: false })
    @IsString()
    @IsOptional()
    group_id?: string;
}
