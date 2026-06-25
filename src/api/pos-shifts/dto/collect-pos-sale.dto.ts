import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';

export class CollectPosSaleDto {
  @ApiProperty({
    required: false,
    description:
      'Cliente al cobrar. Si no se envía, se mantiene el de la orden (p. ej. mostrador).',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined ? undefined : Number(value),
  )
  @IsInt()
  customer_id?: number;

  @ApiProperty({
    enum: PosSalePaymentMethod,
    description: 'Método de pago aplicado en cobranza',
  })
  @IsEnum(PosSalePaymentMethod)
  payment_method: PosSalePaymentMethod;

  @ApiProperty({
    required: false,
    description: 'Monto de la orden cubierto con efectivo MXN',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_cash_mxn?: number;

  @ApiProperty({
    required: false,
    description: 'Monto en USD aplicado a la orden (se convierte con tipo de cambio)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_cash_usd?: number;

  @ApiProperty({
    required: false,
    description: 'Tipo de cambio USD→MXN. Obligatorio si amount_cash_usd > 0',
  })
  @ValidateIf((dto: CollectPosSaleDto) => (dto.amount_cash_usd ?? 0) > 0)
  @IsNumber()
  @Min(0.0001)
  usd_exchange_rate?: number;

  @ApiProperty({ required: false, description: 'Monto cubierto con transferencia (MXN)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_transfer_mxn?: number;

  @ApiProperty({ required: false, description: 'Referencia de transferencia' })
  @ValidateIf((dto: CollectPosSaleDto) => (dto.amount_transfer_mxn ?? 0) > 0)
  @IsString()
  @MaxLength(120)
  transfer_reference?: string;

  @ApiProperty({ required: false, description: 'Monto cubierto con tarjeta (MXN)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_card_mxn?: number;

  @ApiProperty({ required: false, description: 'Referencia o últimos dígitos de tarjeta' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  card_reference?: string;

  @ApiProperty({
    required: false,
    description: 'Efectivo MXN recibido del cliente (para calcular cambio)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  received_cash_mxn?: number;

  @ApiProperty({
    required: false,
    description: 'Efectivo USD recibido del cliente (para calcular cambio)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  received_cash_usd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
