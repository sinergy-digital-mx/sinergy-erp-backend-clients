import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CloneSalesOrderLineDto {
  @ApiProperty({ description: 'ID de la línea de la orden origen' })
  @IsUUID()
  line_id: string;

  @ApiProperty({
    required: false,
    description: 'Concepto nuevo de la línea (ej. «Desarrollo de software septiembre»).',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  custom_description?: string;

  @ApiProperty({ required: false, description: 'Precio unitario nuevo (hasta 4 decimales).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;
}

export class CloneSalesOrderDto {
  @ApiProperty({
    required: false,
    type: [CloneSalesOrderLineDto],
    description: 'Líneas a modificar. Las que no se envían se copian igual.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloneSalesOrderLineDto)
  lines?: CloneSalesOrderLineDto[];

  @ApiProperty({ required: false, description: 'Notas de la nueva orden. Si se omite se copian las originales.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Fecha de entrega (YYYY-MM-DD). Si se omite, hoy.' })
  @IsOptional()
  @IsDateString()
  expected_delivery_date?: string;
}
