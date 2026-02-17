import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateLeadGroupDto {
    @ApiProperty({
        description: 'Lead group name',
        example: 'Google Import 2026'
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Lead group description',
        example: 'Leads imported from Google Ads campaign',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;
}
