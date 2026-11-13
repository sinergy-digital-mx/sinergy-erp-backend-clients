import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsNumber, IsUUID, IsIn } from 'class-validator';
import { CUSTOMER_LIST_INSIGHTS } from '../utils/customer-list-insight.util';

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
        description: 'Search term: name, full name, email, phone, company, RFC, fiscal name, contacts, contracts',
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

    @ApiPropertyOptional({
        description: 'Razón social de registro asignada al cliente',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID()
    registered_fiscal_configuration_id?: string;

    @ApiPropertyOptional({
        description: 'Corte del resumen. Requiere el permiso ViewStats; si no, se ignora.',
        enum: CUSTOMER_LIST_INSIGHTS,
        example: 'fiscal_not_ready',
    })
    @IsOptional()
    @IsString()
    @IsIn(CUSTOMER_LIST_INSIGHTS)
    insight?: string;
}
