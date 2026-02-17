import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsNumber } from 'class-validator';

export class QueryCustomersDto {
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
        description: 'Filter by customer group ID',
        example: 'uuid-here'
    })
    @IsOptional()
    @IsString()
    group_id?: string;
}
