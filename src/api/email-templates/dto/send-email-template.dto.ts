import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { RenderEmailTemplateContextDto } from './render-email-template.dto';

export class SendEmailTemplateDto {
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

  @ApiPropertyOptional({
    example: {
      customer: { name: 'Maria Lopez', email: 'maria@example.com' },
      payment: { amount_pending: '$1,250.00' },
    },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'cliente@example.com' })
  @IsOptional()
  @IsEmail()
  toEmail?: string;

  @ApiPropertyOptional({ example: ['admin@example.com'] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ example: ['auditoria@example.com'] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiPropertyOptional({ example: 'Mensaje opcional para auditoria interna' })
  @IsOptional()
  @IsString()
  note?: string;
}
