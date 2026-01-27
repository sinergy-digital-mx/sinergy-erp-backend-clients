// src/api/leads/dto/query-lead-activity.dto.ts
import { IsEnum, IsOptional, IsDateString, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, ActivityStatus } from '../../../entities/leads/lead-activity.entity';

export class QueryLeadActivityDto {
    @IsEnum(ActivityType)
    @IsOptional()
    type?: ActivityType;

    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus;

    @IsDateString()
    @IsOptional()
    from_date?: string;

    @IsDateString()
    @IsOptional()
    to_date?: string;

    @IsString()
    @IsOptional()
    user_id?: string;

    @IsString()
    @IsOptional()
    outcome?: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 10;

    @IsString()
    @IsOptional()
    sort_by?: string = 'activity_date';

    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    sort_order?: 'ASC' | 'DESC' = 'DESC';
}