import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerGroupDto {
    @ApiProperty({
        description: 'Nombre del grupo',
        example: 'Mayoreo',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({
        description: 'Descripción del grupo',
        example: 'Clientes de mayoreo',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;
}
