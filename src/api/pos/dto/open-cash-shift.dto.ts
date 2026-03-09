import { IsNumber, IsUUID, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashShiftDto {
  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiProperty({ description: 'Initial cash amount', example: 1000 })
  @IsNumber()
  @Min(0)
  initial_cash: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Turno matutino' })
  @IsOptional()
  @IsString()
  notes?: string;
}
