import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerGroupDto {
    @ApiProperty({
        description: 'Group name',
        example: 'Divino Living',
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'Group description',
        example: 'Premium residential development',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
