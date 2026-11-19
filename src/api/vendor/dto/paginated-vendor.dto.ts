import { VendorView } from './vendor-view.dto';

export class PaginatedVendorDto {
  data: VendorView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
