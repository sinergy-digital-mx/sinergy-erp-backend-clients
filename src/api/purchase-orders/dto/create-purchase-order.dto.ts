import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLineItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsUUID()
  @IsNotEmpty()
  uom_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_total: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  iva_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iva_unit?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  ieps_percentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  ieps_unit?: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  fiscal_configuration_id: string;

  /** Sucursal de la razón. Opcional: si no se envía, se toma del almacén. */
  @IsUUID()
  @IsOptional()
  billing_branch_id?: string;

  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @IsUUID()
  @IsNotEmpty()
  vendor_id: string;

  @IsDateString()
  @IsNotEmpty()
  expected_delivery_date: string;

  @IsEnum(['Pendiente', 'Pagado'])
  @IsOptional()
  payment_status?: string;

  @IsEnum(['MXN', 'USD'])
  @IsOptional()
  payment_currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  /** Número de pedimento. Solo si el proveedor es internacional. */
  @IsString()
  @IsOptional()
  @MaxLength(30)
  pedimento_number?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  line_items: CreateLineItemDto[];
}
