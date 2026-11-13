import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';

export class CollectCardPaymentDto {
  @ApiProperty({ description: 'Monto de este cargo de tarjeta (MXN)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount_mxn: number;

  @ApiProperty({ required: false, description: 'Número de voucher del ticket de la terminal' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}

export class CollectPosSaleDto {
  @ApiProperty({
    required: false,
    description:
      'Sucursal seleccionada en POS. El cobro entra al corte abierto de esa sucursal.',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

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
    description: 'Tipo de cambio USD→MXN. Obligatorio si hay efectivo o cheque en dólares',
  })
  @ValidateIf(
    (dto: CollectPosSaleDto) =>
      (dto.amount_cash_usd ?? 0) > 0 || (dto.amount_check_usd ?? 0) > 0,
  )
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

  @ApiProperty({
    required: false,
    description:
      'Nombre de quien transfiere. Obligatorio si no hay razón social y hay monto de transferencia.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  transfer_payer_name?: string;

  @ApiProperty({
    required: false,
    description:
      'Razón social de quien transfiere. Obligatoria si no hay nombre y hay monto de transferencia.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  transfer_payer_business_name?: string;

  @ApiProperty({ required: false, description: 'Monto cubierto con tarjeta (MXN)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_card_mxn?: number;

  @ApiProperty({ required: false, description: 'Número de voucher del ticket de la terminal' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  card_reference?: string;

  @ApiProperty({
    required: false,
    description: 'Nombre de quien paga con tarjeta. Obligatorio si amount_card_mxn > 0.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  card_payer_name?: string;

  @ApiProperty({
    required: false,
    description:
      'Teléfono de quien paga con tarjeta (mínimo 10 dígitos). Obligatorio si amount_card_mxn > 0.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  card_payer_phone?: string;

  @ApiProperty({
    required: false,
    type: [CollectCardPaymentDto],
    description:
      'Cargos de tarjeta en mixto (2 o más tarjetas). La suma debe coincidir con amount_card_mxn si se envía.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CollectCardPaymentDto)
  card_payments?: CollectCardPaymentDto[];

  @ApiProperty({ required: false, description: 'Monto cubierto con cheque (MXN)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_check_mxn?: number;

  @ApiProperty({
    required: false,
    description: 'Monto del cheque en USD. Se convierte con usd_exchange_rate.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_check_usd?: number;

  @ApiProperty({ required: false, description: 'Número o referencia del cheque' })
  @ValidateIf(
    (dto: CollectPosSaleDto) =>
      (dto.amount_check_mxn ?? 0) > 0 || (dto.amount_check_usd ?? 0) > 0,
  )
  @IsString()
  @MaxLength(120)
  check_reference?: string;

  @ApiProperty({
    required: false,
    description: 'Nombre de quien paga con cheque. Obligatorio si el cheque tiene monto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  check_payer_name?: string;

  @ApiProperty({
    required: false,
    description:
      'Teléfono de quien paga con cheque (mínimo 10 dígitos). Obligatorio si el cheque tiene monto.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  check_payer_phone?: string;

  @ApiProperty({
    required: false,
    description: 'Monto cubierto a crédito (MXN). Si payment_method = credit y se omite, se usa el saldo pendiente.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_credit_mxn?: number;

  @ApiProperty({
    required: false,
    description: 'Si true, pide timbrar factura al cobrar. Requiere datos fiscales completos del cliente.',
  })
  @IsOptional()
  @IsBoolean()
  generate_invoice?: boolean;

  @ApiProperty({
    required: false,
    enum: ['MXN', 'USD'],
    default: 'MXN',
    description:
      'Moneda de la orden y de la factura. USD solo si el pago aplicado en dólares es mayor que el pago en pesos.',
  })
  @IsOptional()
  @IsEnum(['MXN', 'USD'])
  order_currency?: 'MXN' | 'USD';

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

  @ApiProperty({
    required: false,
    description:
      'Nombre para el ticket si se cobra como Público en general. Vacío lo borra.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  walk_in_name?: string;

  @ApiProperty({
    required: false,
    description: 'Teléfono para el ticket si se cobra como Público en general.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  walk_in_phone?: string;

  @ApiProperty({
    required: false,
    description:
      'RFC para el ticket si se cobra como Público en general. Vacío lo borra.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]/g, '') : value,
  )
  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.length > 0)
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'El RFC debe tener 12 o 13 caracteres',
  })
  walk_in_rfc?: string;
}
