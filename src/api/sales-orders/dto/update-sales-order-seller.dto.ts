import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateSalesOrderSellerDto {
  @ApiProperty({ description: 'UUID del usuario vendedor (con pos_user_code)' })
  @IsUUID()
  seller_user_id: string;
}
