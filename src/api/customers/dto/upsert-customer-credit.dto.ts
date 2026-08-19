import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
}

export class UpsertCustomerCreditsDto {
  @ApiProperty({ type: [UpsertCustomerCreditItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertCustomerCreditItemDto)
  credits: UpsertCustomerCreditItemDto[];
}
