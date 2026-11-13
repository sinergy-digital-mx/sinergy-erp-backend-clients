import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class StampSalesOrderCreditNoteDto {
  @ApiProperty({
    description: 'Total de la nota, con IVA. No puede pasar el disponible de la factura.',
    example: 200,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Motivo. Queda como descripción del concepto.' })
  @IsString()
  @MinLength(3)
  @MaxLength(250)
  reason: string;

  @ApiPropertyOptional({ default: 'G02', description: 'Uso CFDI. G02 es devoluciones, descuentos o bonificaciones.' })
  @IsOptional()
  @IsString()
  uso_cfdi?: string;

  @ApiPropertyOptional({ enum: ['demo', 'production'] })
  @IsOptional()
  @IsIn(['demo', 'production'])
  environment?: 'demo' | 'production';
}
