import { IsNotEmpty, IsString, IsOptional, IsUUID, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePosConfigurationDto {
  @ApiProperty({ 
    description: 'Equipment code identifier', 
    example: 'Computadora 1',
    maxLength: 255
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  code: string;

  @ApiProperty({ 
    description: 'Branch UUID where equipment is located', 
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsUUID()
  sucursal: string;

  @ApiProperty({ 
    description: 'Equipment model specification', 
    example: 'Dell OptiPlex 7090',
    required: false,
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  modelo?: string;

  @ApiProperty({ 
    description: 'Configuration status: 1 = active, 0 = inactive', 
    example: 1,
    enum: [0, 1],
    required: false
  })
  @IsOptional()
  @IsIn([0, 1])
  status?: number;
}