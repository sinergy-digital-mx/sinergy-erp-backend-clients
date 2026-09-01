import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectInventoryAuditDto {
  @ApiProperty({ description: 'Motivo del rechazo. La auditoría vuelve a borrador.' })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  reason: string;
}
