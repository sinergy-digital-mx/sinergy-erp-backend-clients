import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckCustomerDuplicatesDto {
    @ApiPropertyOptional({ description: 'Nombre', example: 'Juan' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'Apellido', example: 'Pérez' })
    @IsString()
    @IsOptional()
    lastname?: string;

    @ApiPropertyOptional({ description: 'Correo', example: 'juan@ejemplo.com' })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({ description: 'Teléfono (nacional o con lada)', example: '6647945661' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ description: 'Lada', example: '+52' })
    @IsString()
    @IsOptional()
    phone_code?: string;

    @ApiPropertyOptional({ description: 'RFC', example: 'PEGJ800101XXX' })
    @IsString()
    @IsOptional()
    fiscal_rfc?: string;
}
