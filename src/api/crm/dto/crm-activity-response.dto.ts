import {
  CustomerActivityStatus,
  CustomerActivityType,
} from '../../../entities/customers/customer-activity.entity';
import { CrmAttentionFilter, CrmReportPeriod } from './query-crm-activity.dto';

export class CrmActivityUserDto {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  display_name: string;
}

export class CrmActivityCustomerDto {
  id: number;
  name: string;
  lastname: string | null;
  company_name: string | null;
  display_name: string;
}

export class CrmActivityItemDto {
  id: string;
  customer_id: number;
  customer: CrmActivityCustomerDto | null;
  user_id: string | null;
  user: CrmActivityUserDto | null;
  type: CustomerActivityType;
  status: CustomerActivityStatus;
  title: string;
  description: string | null;
  notes: string | null;
  activity_date: Date;
  follow_up_date: Date | null;
  duration_minutes: number | null;
  outcome: string | null;
  is_overdue_follow_up: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CrmActivityAuthorDto {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  display_name: string;
  activity_count: number;
}

export class CrmActivityListResponseDto {
  activities: CrmActivityItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  is_crm_admin: boolean;
}

export class CrmActivityStatsResponseDto {
  is_crm_admin: boolean;
  period: {
    period: CrmReportPeriod;
    date_from: string;
    date_to: string;
    label: string;
  };
  totals: {
    activities: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  };
  attention: {
    pending_calls: number;
    pending_follow_ups: number;
    overdue_follow_ups: number;
    upcoming_follow_ups: number;
    pending_tasks: number;
  };
}

export class CrmActivityAuthorsResponseDto {
  is_crm_admin: boolean;
  authors: CrmActivityAuthorDto[];
}

export { CrmAttentionFilter, CrmReportPeriod };
