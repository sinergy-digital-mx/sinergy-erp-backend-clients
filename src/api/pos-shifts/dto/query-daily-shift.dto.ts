import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PosDailyShiftStatus } from '../../../entities/pos/pos-daily-shift-status.enum';

export class QueryDailyShiftDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  terminal_user_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billing_branch_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shift_date?: string;

  @ApiProperty({ required: false, enum: PosDailyShiftStatus })
  @IsOptional()
  @IsEnum(PosDailyShiftStatus)
  status?: PosDailyShiftStatus;
}
