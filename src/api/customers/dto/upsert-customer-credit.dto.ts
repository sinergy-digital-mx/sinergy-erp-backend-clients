import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpsertCustomerCreditItemDto {
  @ApiProperty({ description: 'Razón social (fiscal_configuration_id)' })
  @IsUUID()
  fiscal_configuration_id: string;

  @ApiProperty()
  @IsBoolean()
  credit_enabled: boolean;

  @ApiProperty({
    required: false,
    description:
      'Autorización temporal de una venta que supere el monto. Se apaga al cobrarla.',
  })
  @IsOptional()
  @IsBoolean()
  allow_credit_exceed?: boolean;

  @ApiProperty({ required: false, example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  credit_days?: number | null;

  @ApiProperty({ required: false, example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  credit_amount?: number | null;

  @ApiProperty({ required: false, enum: ['MXN', 'USD'], default: 'MXN' })
  @IsOptional()
  @IsEnum(['MXN', 'USD'])
  credit_currency?: 'MXN' | 'USD';
}

export class UpsertCustomerCreditsDto {
  @ApiProperty({ type: [UpsertCustomerCreditItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertCustomerCreditItemDto)
  credits: UpsertCustomerCreditItemDto[];
}
