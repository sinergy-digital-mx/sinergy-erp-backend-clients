import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  SalesGoalMetricType,
  SalesGoalPeriodType,
  SalesGoalScope,
} from '../../../entities/goals/sales-goal.entity';

export class CreateSalesGoalDto {
  @ApiProperty({ enum: SalesGoalScope })
  @IsEnum(SalesGoalScope)
  goal_scope: SalesGoalScope;

  @ApiProperty()
  @IsUUID()
  billing_branch_id: string;

  @ApiPropertyOptional({ description: 'Obligatorio si goal_scope = user_role' })
  @ValidateIf((dto: CreateSalesGoalDto) => dto.goal_scope === SalesGoalScope.USER_ROLE)
  @IsUUID()
  role_id?: string;

  @ApiProperty({ enum: SalesGoalMetricType })
  @IsEnum(SalesGoalMetricType)
  metric_type: SalesGoalMetricType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0.01)
  target_value: number;

  @ApiPropertyOptional({ enum: SalesGoalPeriodType, default: SalesGoalPeriodType.MONTH })
  @IsOptional()
  @IsEnum(SalesGoalPeriodType)
  period_type?: SalesGoalPeriodType = SalesGoalPeriodType.MONTH;

  @ApiPropertyOptional({ example: 2026 })
  @ValidateIf(
    (dto: CreateSalesGoalDto) =>
      (dto.period_type ?? SalesGoalPeriodType.MONTH) === SalesGoalPeriodType.MONTH,
  )
  @IsInt()
  @Min(2000)
  @Max(2100)
  period_year?: number;

  @ApiPropertyOptional({ example: 6 })
  @ValidateIf(
    (dto: CreateSalesGoalDto) =>
      (dto.period_type ?? SalesGoalPeriodType.MONTH) === SalesGoalPeriodType.MONTH,
  )
  @IsInt()
  @Min(1)
  @Max(12)
  period_month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

/** Metas activas e inactivas son editables. Todos los campos son opcionales (partial update). */
export class UpdateSalesGoalDto {
  @ApiPropertyOptional({ enum: SalesGoalScope })
  @IsOptional()
  @IsEnum(SalesGoalScope)
  goal_scope?: SalesGoalScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  role_id?: string | null;

  @ApiPropertyOptional({ enum: SalesGoalMetricType })
  @IsOptional()
  @IsEnum(SalesGoalMetricType)
  metric_type?: SalesGoalMetricType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  target_value?: number;

  @ApiPropertyOptional({ enum: SalesGoalPeriodType })
  @IsOptional()
  @IsEnum(SalesGoalPeriodType)
  period_type?: SalesGoalPeriodType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  period_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  period_month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ description: 'true = Activa, false = Inactiva' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class QuerySalesGoalsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiPropertyOptional({ enum: SalesGoalScope })
  @IsOptional()
  @IsEnum(SalesGoalScope)
  goal_scope?: SalesGoalScope;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  period_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  period_month?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === true || value === 'true' || value === '1';
  })
  @IsBoolean()
  is_active?: boolean;
}
