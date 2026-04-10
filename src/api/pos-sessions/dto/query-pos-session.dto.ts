import { IsOptional, IsUUID, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PosSessionStatus } from '../../../entities/pos/pos-session.entity';

export class QueryPosSessionDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Records per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
  @ApiProperty({
    description: 'Filter by POS configuration ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  pos_configuration_id?: string;

  @ApiProperty({
    description: 'Filter by user ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({
    description: 'Filter by session status',
    enum: PosSessionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PosSessionStatus)
  status?: PosSessionStatus;

  @ApiProperty({
    description: 'Filter sessions opened from this date',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiProperty({
    description: 'Filter sessions opened until this date',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}
