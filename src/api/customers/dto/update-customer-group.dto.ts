import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerGroupDto {
    @ApiPropertyOptional({
        description: 'Group name',
        example: 'Divino Living',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Group description',
        example: 'Premium residential development',
    })
    @IsOptional()
    @IsString()
    description?: string;
}
