// src/customers/dto/update-customer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';

export class UpdateCustomerDto {
    @ApiProperty({ description: 'Customer status ID', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    status_id?: number;

    @ApiProperty({ description: 'Customer first name', example: 'John', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'Customer last name', example: 'Doe', required: false })
    @IsString()
    @IsOptional()
    lastname?: string;

    @ApiProperty({ description: 'Customer email', example: 'john@example.com', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ 
        description: 'Customer phone number (without country code)', 
        example: '6647945661', 
        required: false
    })
    @IsString()
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

    @ApiProperty({ description: 'Additional contact first name', required: false })
    @IsString()
    @IsOptional()
    additional_name?: string;

    @ApiProperty({ description: 'Additional contact last name', required: false })
    @IsString()
    @IsOptional()
    additional_lastname?: string;

    @ApiProperty({ description: 'Additional contact email', required: false })
    @Transform(({ value }) => (value === '' || value === null ? undefined : value))
    @IsOptional()
    @IsEmail()
    additional_email?: string;

    @ApiProperty({
        description: 'Additional contact phone (national number, same as principal phone field)',
        required: false,
    })
    @IsString()
    @IsOptional()
    additional_phone?: string;

    @ApiProperty({ description: 'Additional contact phone country ISO (2 letters)', example: 'MX', required: false })
    @IsString()
    @IsOptional()
    additional_phone_country?: string;

    @ApiProperty({ description: 'Additional contact phone country dial code', example: '+52', required: false })
    @IsString()
    @IsOptional()
    additional_phone_code?: string;
}
