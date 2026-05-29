import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailTemplateCustomVariableDto } from './email-template-variable.dto';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'Recordatorio de pago' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 150)
  name: string;

  @ApiProperty({ example: 'Recordatorio de pago pendiente' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  subject: string;

  @ApiProperty({ example: '<p>Hola {{customer.name}}, tienes un pago pendiente.</p>' })
  @IsNotEmpty()
  @IsString()
  bodyHtml: string;

  @ApiPropertyOptional({ example: ['customer.name', 'payment.amount_pending'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.-]*$/, { each: true })
  variables?: string[];

  @ApiPropertyOptional({ type: [EmailTemplateCustomVariableDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailTemplateCustomVariableDto)
  customVariables?: EmailTemplateCustomVariableDto[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
