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
        description: 'Number of leads where customer responded',
        example: 200
    })
    customer_responded: number;

    @ApiProperty({
        description: 'Number of leads contacted but customer has not replied',
        example: 250
    })
    customer_responded_no_reply: number;

    @ApiProperty({
        description: 'Number of leads where customer replied but agent has not replied back (awaiting agent response)',
        example: 75
    })
    awaiting_agent_reply: number;

    @ApiProperty({
        description: 'Number of leads with active conversation (both parties have exchanged messages)',
        example: 125
    })
    conversation_active: number;

    @ApiProperty({
        description: 'Number of leads not yet contacted',
        example: 50
    })
    not_contacted: number;
}
