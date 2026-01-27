import { ApiProperty } from '@nestjs/swagger';
import { Lead } from '../../../entities/leads/lead.entity';

export class PaginatedLeadsDto {
    @ApiProperty({
        description: 'Array of leads',
        type: [Lead]
    })
    data: Lead[];

    @ApiProperty({
        description: 'Total number of leads',
        example: 150
    })
    total: number;

    @ApiProperty({
        description: 'Current page number',
        example: 1
    })
    page: number;

    @ApiProperty({
        description: 'Number of items per page',
        example: 20
    })
    limit: number;

    @ApiProperty({
        description: 'Total number of pages',
        example: 8
    })
    totalPages: number;

    @ApiProperty({
        description: 'Whether there is a next page',
        example: true
    })
    hasNext: boolean;

    @ApiProperty({
        description: 'Whether there is a previous page',
        example: false
    })
    hasPrev: boolean;
}