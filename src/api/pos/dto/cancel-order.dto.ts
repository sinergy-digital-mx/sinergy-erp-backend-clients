import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ description: 'Cancellation reason', example: 'Cliente canceló el pedido' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
