import { IsString, IsEnum, IsOptional, IsInt, IsDateString } from 'class-validator';
import { CustomerActivityType, CustomerActivityStatus } from '../../../entities/customers/customer-activity.entity';

export class CreateCustomerActivityDto {
  @IsEnum(CustomerActivityType)
  @IsOptional()
  type?: CustomerActivityType;

  @IsEnum(CustomerActivityStatus)
  @IsOptional()
  status?: CustomerActivityStatus;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
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

  @IsOptional()
  metadata?: Record<string, any>;
}
