import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../../entities/products/product.entity';

export class PaginatedProductDto {
  @ApiProperty({ type: [Product] })
  data: Product[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
