import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AuthorizeInventoryAuditDto {
  @ApiPropertyOptional({ description: 'Notas de autorización' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
