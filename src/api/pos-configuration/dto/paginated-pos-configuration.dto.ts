import { ApiProperty } from '@nestjs/swagger';
import { PosConfiguration } from '../../../entities/billing/pos-configuration.entity';

export class PaginatedPosConfigurationDto {
  @ApiProperty({ 
    description: 'Array of POS configuration records',
    type: [PosConfiguration]
  })
  data: PosConfiguration[];

  @ApiProperty({ 
    description: 'Total number of records',
    example: 100
  })
  total: number;

  @ApiProperty({ 
    description: 'Current page number',
    example: 1
  })
  page: number;

  @ApiProperty({ 
    description: 'Number of records per page',
    example: 20
  })
  limit: number;

  @ApiProperty({ 
    description: 'Total number of pages',
    example: 5
  })
  totalPages: number;

  @ApiProperty({ 
    description: 'Whether there is a next page',
    example: true
  })
  hasNext: boolean;

  @ApiProperty({ 
    description: 'Whether there is a previous page',
    example: false
  })
  hasPrev: boolean;
}
