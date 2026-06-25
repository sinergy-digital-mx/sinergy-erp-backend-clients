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
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  uom_id: string;

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
