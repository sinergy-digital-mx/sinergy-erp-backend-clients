import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';

export class PaginatedFiscalConfigurationDto {
  data: FiscalConfiguration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
