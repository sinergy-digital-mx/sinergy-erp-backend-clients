// src/customers/dto/create-customer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';
import { IsPhone } from '../../../common/decorators/is-phone.decorator';

export class CreateCustomerDto {
    @ApiProperty({ description: 'Customer status ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    status_id: number;

    @ApiProperty({ description: 'Customer first name', example: 'John' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Customer last name', example: 'Doe', required: false })
    @IsString()
    @IsOptional()
    lastname?: string;

    @ApiProperty({ description: 'Customer email', example: 'john@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ 
        description: 'Customer phone in E.164 format. Must include country code. Examples: +1 2025551234 (USA), +52 6647945661 (Mexico), +44 2071838750 (UK)', 
        example: '+52 6647945661', 
        required: false
    })
    @IsPhone()
    @IsOptional()
    phone?: string;

    @ApiProperty({ description: 'Phone country code', example: '+52', required: false })
    @IsString()
    @IsOptional()
    phone_code?: string;

    @ApiProperty({ description: 'Customer country', example: 'Mexico', required: false })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiProperty({ description: 'Company name', example: 'Acme Corporation', required: false })
    @IsString()
    @IsOptional()
    company_name?: string;

    @ApiProperty({ description: 'Company website', example: 'https://example.com', required: false })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiProperty({ description: 'Customer group ID', example: 'uuid-here', required: false })
    @IsString()
    @IsOptional()
    group_id?: string;
}