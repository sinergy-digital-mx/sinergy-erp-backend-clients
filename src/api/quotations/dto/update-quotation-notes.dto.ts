import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQuotationNotesDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Observaciones de la cotización. Salen en el PDF. Enviar null o cadena vacía para borrar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
