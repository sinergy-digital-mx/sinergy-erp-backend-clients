import { IsEnum, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveType } from '../../../entities/employees/leave-type.enum';
import { LeaveStatus } from '../../../entities/employees/leave-status.enum';

export class QueryLeaveRequestDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;
}
