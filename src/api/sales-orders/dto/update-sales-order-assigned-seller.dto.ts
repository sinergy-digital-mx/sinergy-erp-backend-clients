import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UpdateSalesOrderAssignedSellerDto {
  @ApiProperty({
    description: 'UUID del comisionado (quien cobra comisión). Usuario con pos_user_code.',
  })
  @IsUUID()
  assigned_seller_user_id: string;
}
