// src/api/leads/dto/query-lead-activity.dto.ts
import { IsEnum, IsOptional, IsDateString, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityType, ActivityStatus } from '../../../entities/leads/lead-activity.entity';

export class QueryLeadActivityDto {
    @ApiProperty({ 
        description: 'Filter by activity type', 
        enum: ActivityType,
        required: false 
    })
    @IsEnum(ActivityType)
    @IsOptional()
    type?: ActivityType;

    @ApiProperty({ 
        description: 'Filter by activity status', 
        enum: ActivityStatus,
        required: false 
    })
    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus;

    @ApiProperty({ 
        description: 'Filter activities from this date', 
        example: '2024-01-01T00:00:00Z',
        required: false 
    })
    @IsDateString()
    @IsOptional()
    from_date?: string;

    @ApiProperty({ 
        description: 'Filter activities to this date', 
        example: '2024-01-31T23:59:59Z',
        required: false 
    })
    @IsDateString()
    @IsOptional()
    to_date?: string;

    @ApiProperty({ 
        description: 'Filter by user who created the activity', 
        example: 'user-uuid-here',
        required: false 
    })
    @IsString()
    @IsOptional()
    user_id?: string;

    @ApiProperty({ 
        description: 'Filter by activity outcome', 
        example: 'Interested',
        required: false 
    })
    @IsString()
    @IsOptional()
    outcome?: string;

    @ApiProperty({ 
        description: 'Page number for pagination', 
        example: 1,
        minimum: 1,
        required: false 
    })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @ApiProperty({ 
        description: 'Number of items per page', 
        example: 10,
        minimum: 1,
        required: false 
    })
    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 10;

    @ApiProperty({ 
        description: 'Field to sort by', 
        example: 'activity_date',
        required: false 
    })
    @IsString()
    @IsOptional()
    sort_by?: string = 'activity_date';

    @ApiProperty({ 
        description: 'Sort order', 
        enum: ['ASC', 'DESC'],
        example: 'DESC',
        required: false 
    })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    sort_order?: 'ASC' | 'DESC' = 'DESC';
}