import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendSalesOrderInvoiceWhatsappDto {
  @ApiPropertyOptional({
    description: 'Teléfono de WhatsApp. Si se omite se usa el del cliente.',
    example: '6641745294',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Id del grupo de WhatsApp (`120363…@g.us`). Si viene, se ignora el teléfono.',
    example: '120363025246125738@g.us',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  group_id?: string;
}
