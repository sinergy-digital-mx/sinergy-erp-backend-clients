import { Vendor } from '../../../entities/vendor/vendor.entity';

export class PaginatedVendorDto {
  data: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
