import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSalesOrderForShippingDto {
  @ApiProperty({
    description: 'true marca la orden para envío. false la quita. No la asigna a una ruta.',
  })
  @IsBoolean()
  for_shipping: boolean;
}
