import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateSalesOrderLineItemDto {
  @IsUUID()
  product_id: string;

  @IsUUID()
  product_uom_id: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario. Hasta 4 decimales (p. ej. 2.150). No redondear a 2.',
    example: 2.15,
  })
  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_percentage?: number = 0;

  @ApiProperty({
    required: false,
    description:
      'Descuento unitario ya pactado (p. ej. al convertir cotización). No se recalcula con el catálogo.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_unit?: number;

  @ApiProperty({
    required: false,
    description: 'Descuento de producto seleccionado en POS/venta. Tiene prioridad sobre discount_percentage.',
  })
  @IsOptional()
  @IsUUID()
  product_discount_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Concepto libre de la línea. Si se envía, se muestra y se factura en lugar del nombre del producto.',
    example: 'Desarrollo de software septiembre',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(255)
  custom_description?: string;

  @ApiProperty({
    required: false,
    description: 'Nota de la línea. Sale debajo del producto y en el PDF.',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  iva_percentage?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ieps_percentage?: number = 0;
}

export class CreateSalesOrderDto {
  @IsUUID()
  fiscal_configuration_id: string;

  @ApiProperty({
    required: false,
    description:
      'Sucursal. Obligatoria en MANUAL. En POS, si se omite se toma del almacén.',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Almacén. Obligatorio en POS. En MANUAL no se envía: el inventario sale de los almacenes de la sucursal.',
  })
  @ValidateIf(
    (dto: CreateSalesOrderDto) =>
      dto.sales_order_type === 'POS' || dto.warehouse_id != null,
  )
  @IsUUID()
  warehouse_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Cliente. Obligatorio en órdenes MANUAL. En POS es opcional (mostrador si se omite).',
  })
  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsDateString()
  expected_delivery_date?: string;

  @IsOptional()
  @IsEnum(['POS', 'MANUAL'])
  sales_order_type?: 'POS' | 'MANUAL';

  @ApiProperty({
    required: false,
    enum: ['MXN', 'USD'],
    default: 'MXN',
    description:
      'Moneda de toda la orden y de su factura. En POS se ignora: se define al cobrar, y solo puede ser USD si el pago en dólares es mayor.',
  })
  @IsOptional()
  @IsEnum(['MXN', 'USD'])
  currency?: 'MXN' | 'USD';

  @ValidateIf((dto: CreateSalesOrderDto) => dto.sales_order_type === 'POS')
  @IsUUID()
  @ApiProperty({
    required: false,
    description:
      'Vendedor. Obligatorio en POS. En MANUAL, si se omite se usa el usuario que crea la orden.',
  })
  seller_user_id?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    required: false,
    description:
      'Comisionado (quien cobra comisión). Si se omite, se toma del vendedor asignado del cliente; si el cliente no tiene, se usa el vendedor.',
  })
  assigned_seller_user_id?: string;

  @ApiProperty({
    required: false,
    description:
      'Opcional. Si no se envía, se resuelve el corte abierto de cobranza de la sucursal.',
  })
  @IsOptional()
  @IsUUID()
  pos_daily_shift_id?: string;

  @IsOptional()
  @IsString()
  fiscal_razon_social?: string;

  @IsOptional()
  @IsEnum(['Pendiente', 'Pagado'])
  payment_status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description: 'Nombre para el ticket si la venta es Público en general',
  })
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  walk_in_name?: string;

  @ApiProperty({
    required: false,
    description: 'RFC para el ticket si la venta es Público en general',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]/g, '') || undefined : value,
  )
  @IsOptional()
  @IsString()
  @Matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, {
    message: 'El RFC debe tener 12 o 13 caracteres',
  })
  walk_in_rfc?: string;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Si true (solo MANUAL), la orden entra en En Selección y requiere corroboración en Control de almacén. Ignorado en POS.',
  })
  @IsOptional()
  @IsBoolean()
  requires_selection_assembly?: boolean;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Si true, la orden queda marcada para envío. No la asigna a una ruta. Aplica a MANUAL y POS.',
  })
  @IsOptional()
  @IsBoolean()
  for_shipping?: boolean;

  @ApiProperty({
    required: false,
    enum: ['inventory', 'services', 'combined'],
    default: 'inventory',
    description:
      'Inventario, servicios o productos y servicios. POS ignora el valor y queda inventory.',
  })
  @IsOptional()
  @IsEnum(['inventory', 'services', 'combined'])
  sale_scope?: 'inventory' | 'services' | 'combined';

  @ApiProperty({
    required: false,
    description:
      'Descuento global seleccionado en POS/venta (ej. Descuento de carpintero). Se aplica sobre el subtotal neto después de descuentos por línea.',
  })
  @IsOptional()
  @IsUUID()
  global_discount_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineItemDto)
  line_items: CreateSalesOrderLineItemDto[];
}
