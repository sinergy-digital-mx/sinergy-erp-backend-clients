import { IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DailySalesQueryDto {
  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiProperty({ description: 'Date (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  date: string;
}
