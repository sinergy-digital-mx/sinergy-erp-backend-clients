import { Type } from 'class-transformer';
import { IsEnum, IsOptional, Max, Min } from 'class-validator';
import { OvertimeStatus } from '../../../entities/employees/overtime-status.enum';

export class QueryOvertimeRequestDto {
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
  @IsEnum(OvertimeStatus, {
    message: 'El estatus debe ser pending, approved, rejected o paid',
  })
  status?: OvertimeStatus;
}
