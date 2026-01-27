// src/api/leads/dto/create-lead-activity.dto.ts
import { IsEnum, IsString, IsOptional, IsDateString, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityType, ActivityStatus } from '../../../entities/leads/lead-activity.entity';

export class CreateLeadActivityDto {
    @ApiProperty({ 
        description: 'Type of activity', 
        enum: ActivityType,
        example: ActivityType.CALL 
    })
    @IsEnum(ActivityType)
    type: ActivityType;

    @ApiProperty({ 
        description: 'Status of the activity', 
        enum: ActivityStatus,
        example: ActivityStatus.COMPLETED,
        required: false 
    })
    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus = ActivityStatus.COMPLETED;

    @ApiProperty({ 
        description: 'Title of the activity', 
        example: 'Follow-up call with prospect' 
    })
    @IsString()
    title: string;

    @ApiProperty({ 
        description: 'Detailed description of the activity', 
        example: 'Discussed pricing and next steps',
        required: false 
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ 
        description: 'Date and time when the activity occurred', 
        example: '2024-01-27T14:30:00Z' 
    })
    @IsDateString()
    activity_date: string;

    @ApiProperty({ 
        description: 'Duration of the activity in minutes', 
        example: 30,
        minimum: 1,
        maximum: 1440,
        required: false 
    })
    @IsInt()
    @Min(1)
    @Max(1440) // Max 24 hours
    @IsOptional()
    duration_minutes?: number;

    @ApiProperty({ 
        description: 'Outcome or result of the activity', 
        example: 'Interested in premium package',
        required: false 
    })
    @IsString()
    @IsOptional()
    outcome?: string;

    @ApiProperty({ 
        description: 'Date for follow-up activity', 
        example: '2024-02-01T10:00:00Z',
        required: false 
    })
    @IsDateString()
    @IsOptional()
    follow_up_date?: string;

    @ApiProperty({ 
        description: 'Additional notes about the activity', 
        example: 'Customer seemed very interested, send proposal by Friday',
        required: false 
    })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ 
        description: 'Additional metadata as key-value pairs', 
        example: { call_quality: 'excellent', customer_mood: 'positive' },
        required: false 
    })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}