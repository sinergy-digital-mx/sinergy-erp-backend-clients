import { Subcategory } from '../../../entities/categories/subcategory.entity';

export class PaginatedSubcategoryDto {
  data: Subcategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
