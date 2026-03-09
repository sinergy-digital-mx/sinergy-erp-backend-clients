import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePOSOrderDto {
  @ApiProperty({ description: 'Warehouse ID (POS location)', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiPropertyOptional({ description: 'Table number', example: '5' })
  @IsOptional()
  @IsString()
  table_number?: string;

  @ApiPropertyOptional({ description: 'Zone', example: 'Terraza' })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Cliente VIP' })
  @IsOptional()
  @IsString()
  notes?: string;
}
