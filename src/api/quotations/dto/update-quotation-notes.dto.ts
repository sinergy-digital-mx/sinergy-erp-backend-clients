import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQuotationNotesDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Notas de la cotización. Enviar null o cadena vacía para borrar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
