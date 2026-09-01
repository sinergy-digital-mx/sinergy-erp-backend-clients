import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelInventoryAuditDto {
  @ApiProperty({ description: 'Motivo de cancelación. No aplica correcciones.' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}
