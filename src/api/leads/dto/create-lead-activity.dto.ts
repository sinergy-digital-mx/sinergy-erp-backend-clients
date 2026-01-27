// src/api/leads/dto/create-lead-activity.dto.ts
import { IsEnum, IsString, IsOptional, IsDateString, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, ActivityStatus } from '../../../entities/leads/lead-activity.entity';

export class CreateLeadActivityDto {
    @IsEnum(ActivityType)
    type: ActivityType;

    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus = ActivityStatus.COMPLETED;

    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    activity_date: string;

    @IsInt()
    @Min(1)
    @Max(1440) // Max 24 hours
    @IsOptional()
    duration_minutes?: number;

    @IsString()
    @IsOptional()
    outcome?: string;

    @IsDateString()
    @IsOptional()
    follow_up_date?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}