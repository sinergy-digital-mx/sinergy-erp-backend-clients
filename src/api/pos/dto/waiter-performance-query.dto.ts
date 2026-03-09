import { IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WaiterPerformanceQueryDto {
  @ApiProperty({ description: 'Waiter ID', example: 'uuid' })
  @IsUUID()
  waiter_id: string;

  @ApiProperty({ description: 'Date from (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  date_from: string;

  @ApiProperty({ description: 'Date to (ISO 8601)', example: '2024-01-31' })
  @IsDateString()
  date_to: string;
}
