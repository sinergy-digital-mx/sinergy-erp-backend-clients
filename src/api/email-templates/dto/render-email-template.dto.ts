import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export class RenderEmailTemplateContextDto {
  @ApiProperty({ example: 'payment', enum: ['payment', 'contract', 'customer', 'lead'] })
  @IsIn(['payment', 'contract', 'customer', 'lead'])
  entity: 'payment' | 'contract' | 'customer' | 'lead';

  @ApiProperty({ example: 'payment-id-123' })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class RenderEmailTemplateDto {
  @ApiPropertyOptional({
    example: {
      customer: { name: 'Maria Lopez' },
      payment: { amount_pending: '$1,250.00' },
    },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: {
      entity: 'payment',
      id: 'payment-id-123',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RenderEmailTemplateContextDto)
  context?: RenderEmailTemplateContextDto;
}

export class PreviewEmailTemplateDto extends RenderEmailTemplateDto {
  @ApiPropertyOptional({ example: 'Hola {{customer.name}}' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: '<p>Hola {{customer.name}}, pago pendiente: {{payment.amount_pending}}</p>' })
  @IsString()
  bodyHtml: string;
}
