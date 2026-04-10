import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenPosSessionDto {
  @ApiProperty({
    description: 'ID of the POS configuration (equipment)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty()
  @IsUUID()
  pos_configuration_id: string;

  @ApiProperty({
    description: 'Initial cash amount in the drawer',
    example: 500.00,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  opening_cash: number;

  @ApiProperty({
    description: 'Optional notes for session opening',
    example: 'Starting morning shift',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
