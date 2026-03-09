import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLineStatusDto {
  @ApiProperty({
    description: 'Line item status',
    enum: ['pending', 'preparing', 'ready', 'delivered'],
    example: 'preparing',
  })
  @IsEnum(['pending', 'preparing', 'ready', 'delivered'])
  status: string;
}
