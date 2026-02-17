import { ApiProperty } from '@nestjs/swagger';

export class LeadsStatsDto {
    @ApiProperty({
        description: 'Total number of leads',
        example: 500
    })
    total_leads: number;

    @ApiProperty({
        description: 'Number of leads contacted via email',
        example: 450
    })
    contacted_via_email: number;

    @ApiProperty({
        description: 'Number of leads where customer responded but we havent replied',
        example: 75
    })
    customer_responded_no_reply: number;

    @ApiProperty({
        description: 'Number of leads with customer response',
        example: 200
    })
    customer_responded: number;

    @ApiProperty({
        description: 'Number of leads not yet contacted',
        example: 50
    })
    not_contacted: number;
}
