import { ApiProperty } from '@nestjs/swagger';
import { UoMCatalog } from '../../../entities/uom-catalog/uom-catalog.entity';

export class PaginatedUoMCatalogDto {
  @ApiProperty({ type: [UoMCatalog] })
  data: UoMCatalog[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
