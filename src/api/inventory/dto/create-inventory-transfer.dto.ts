import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInventoryTransferLineDto {
  @ApiProperty({ description: 'ID del lote origen del cual se toma stock' })
  @IsUUID()
  @IsNotEmpty()
  inventory_batch_id: string;

  @ApiProperty({ description: 'Cantidad a transferir desde este lote', example: 10.5 })
  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CreateInventoryTransferDto {
  @ApiPropertyOptional({
    description:
      'Si se envía, todas las líneas deben ser de este producto. Si se omite, cada línea puede ser de un producto distinto.',
  })
  @IsOptional()
  @IsUUID()
  product_id?: string;

  @ApiPropertyOptional({
    description:
      'Si se envía, todas las líneas deben usar esta unidad. Si se omite, cada línea conserva la unidad de su lote.',
  })
  @IsOptional()
  @IsUUID()
  uom_id?: string;

  @ApiProperty({ description: 'Almacén de origen' })
  @IsUUID()
  @IsNotEmpty()
  source_warehouse_id: string;

  @ApiProperty({ description: 'Almacén de destino' })
  @IsUUID()
  @IsNotEmpty()
  destination_warehouse_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [CreateInventoryTransferLineDto],
    description: 'Una o más líneas tomando cantidad de lotes origen',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryTransferLineDto)
  lines: CreateInventoryTransferLineDto[];
}
