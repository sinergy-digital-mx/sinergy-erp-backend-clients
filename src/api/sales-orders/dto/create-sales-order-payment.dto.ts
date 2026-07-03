import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';

export class CreateSalesOrderPaymentDto {
  @ApiProperty({ example: 1500.5 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-07-03' })
  @IsDateString()
  payment_date: string;

  @ApiProperty({ enum: PosSalePaymentMethod, example: PosSalePaymentMethod.TRANSFER })
  @IsEnum(PosSalePaymentMethod)
  payment_method: PosSalePaymentMethod;

  @ApiPropertyOptional({ enum: ['MXN', 'USD'], default: 'MXN' })
  @IsOptional()
  @IsEnum(['MXN', 'USD'])
  currency?: 'MXN' | 'USD' = 'MXN';

  @ApiPropertyOptional({
    example: 'SPEI-123456',
    description: 'Referencia (obligatoria si payment_method = transfer)',
  })
  @ValidateIf((dto: CreateSalesOrderPaymentDto) => dto.payment_method === PosSalePaymentMethod.TRANSFER)
  @IsString()
  @MaxLength(120)
  reference_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
