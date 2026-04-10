import { ApiProperty } from '@nestjs/swagger';
import { PosSession } from '../../../entities/pos/pos-session.entity';

export class PaginatedPosSessionDto {
  @ApiProperty({ type: [PosSession] })
  data: PosSession[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}
