import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class StampPaymentComplementDto {
  @ApiPropertyOptional({
    enum: ['demo', 'production'],
    description: 'Ambiente Finkok. Si se omite, usa el de la factura ligada.',
  })
  @IsOptional()
  @IsIn(['demo', 'production'])
  environment?: 'demo' | 'production';
}
