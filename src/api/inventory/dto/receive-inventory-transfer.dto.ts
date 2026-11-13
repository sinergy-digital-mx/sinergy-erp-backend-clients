import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReceiveInventoryTransferLineDto {
  @ApiProperty({ description: 'Línea de la transferencia' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Cantidad contada en el almacén destino', example: 10 })
  @IsNumber()
  @Min(0)
  quantity_received: number;
}

export class ReceiveInventoryTransferDto {
  @ApiProperty({ type: [ReceiveInventoryTransferLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveInventoryTransferLineDto)
  lines: ReceiveInventoryTransferLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
