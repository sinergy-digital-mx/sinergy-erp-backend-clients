import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator';

export class QueryLeadsDto {
    @ApiPropertyOptional({
        description: 'Page number (1-based)',
        minimum: 1,
        default: 1,
        example: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 20,
        example: 20
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({
        description: 'Search term for name, lastname, email, phone, or company_name',
        example: 'john'
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by status ID',
        example: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @IsInt()
    status_id?: number;

    @ApiPropertyOptional({
        description: 'Filter by email contact status',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    email_contacted?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by customer response status',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    customer_answered?: boolean;

    @ApiPropertyOptional({
        description: 'Filter for leads contacted but not yet replied by customer',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    contacted_no_reply?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by lead group ID',
        example: 'uuid-here'
    })
    @IsOptional()
    @IsString()
    group_id?: string;

    @ApiPropertyOptional({
        description: 'Filter by last email thread status',
        enum: ['draft', 'sent', 'replied', 'closed', 'archived'],
        example: 'replied'
    })
    @IsOptional()
    @IsString()
    last_email_thread_status?: 'draft' | 'sent' | 'replied' | 'closed' | 'archived';

    @ApiPropertyOptional({
        description: 'Filter for leads with no email threads',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    no_email_threads?: boolean;

    @ApiPropertyOptional({
        description: 'Filter for leads with unread email threads',
        example: true
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    has_unread_threads?: boolean;
}