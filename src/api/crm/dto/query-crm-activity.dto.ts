import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  CustomerActivityStatus,
  CustomerActivityType,
} from '../../../entities/customers/customer-activity.entity';

export enum CrmReportPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  RANGE = 'range',
}

export enum CrmAttentionFilter {
  FOLLOW_UP_PENDING = 'follow_up_pending',
  FOLLOW_UP_OVERDUE = 'follow_up_overdue',
  CALL_PENDING = 'call_pending',
  TASK_PENDING = 'task_pending',
}

export class QueryCrmActivityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(CustomerActivityType)
  type?: CustomerActivityType;

  @IsOptional()
  @IsEnum(CustomerActivityStatus)
  status?: CustomerActivityStatus;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsEnum(CrmReportPeriod)
  period?: CrmReportPeriod = CrmReportPeriod.MONTH;

  @ValidateIf((dto: QueryCrmActivityDto) => dto.period === CrmReportPeriod.RANGE)
  @IsDateString()
  date_from?: string;

  @ValidateIf((dto: QueryCrmActivityDto) => dto.period === CrmReportPeriod.RANGE)
  @IsDateString()
  date_to?: string;

  @IsOptional()
  @IsEnum(CrmAttentionFilter)
  attention?: CrmAttentionFilter;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  sort_order?: 'ASC' | 'DESC';
}
