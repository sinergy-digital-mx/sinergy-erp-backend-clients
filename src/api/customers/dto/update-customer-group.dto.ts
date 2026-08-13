import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomerGroupDto {
    @ApiPropertyOptional({
        description: 'Nombre del grupo',
        example: 'Mayoreo',
    })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional({
        description: 'Descripción del grupo',
        example: 'Clientes de mayoreo',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}
