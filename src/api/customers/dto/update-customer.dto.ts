// src/customers/dto/update-customer.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateCustomerDto {
    @ApiProperty({ description: 'Customer status ID', example: 1, required: false })
    @IsNumber()
    @IsOptional()
    status_id?: number;

    @ApiProperty({ description: 'Customer name', example: 'Acme Corporation', required: false })
    @IsString()
    @IsOptional()
    name?: string;
}
