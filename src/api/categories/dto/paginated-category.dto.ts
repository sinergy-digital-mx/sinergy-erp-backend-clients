import { Category } from '../../../entities/categories/category.entity';

export class PaginatedCategoryDto {
  data: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
