import { ApiProperty } from '@nestjs/swagger';
import { BatchResponseDto } from './batch-response.dto';

/**
 * Paginated response DTO for batch list
 * Contains array of batches with pagination metadata
 */
export class BatchListResponseDto {
  @ApiProperty({ type: [BatchResponseDto], description: 'Array of batch records' })
  data: BatchResponseDto[];

  @ApiProperty({ description: 'Total number of records matching the filter' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of records per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
