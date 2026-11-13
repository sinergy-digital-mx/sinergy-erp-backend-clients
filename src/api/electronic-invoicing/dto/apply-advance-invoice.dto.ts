import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ApplyAdvanceInvoiceDto {
  @ApiPropertyOptional({ default: 'G01', description: 'Uso CFDI de la factura de mercancía.' })
  @IsOptional()
  @IsString()
  uso_cfdi?: string;

  @ApiPropertyOptional({
    default: 'G02',
    description: 'Uso CFDI de la nota de crédito que aplica el anticipo.',
  })
  @IsOptional()
  @IsString()
  uso_cfdi_aplicacion?: string;

  @ApiPropertyOptional({ default: '03' })
  @IsOptional()
  @IsString()
  forma_pago?: string;

  @ApiPropertyOptional({ enum: ['PUE', 'PPD'], default: 'PUE' })
  @IsOptional()
  @IsIn(['PUE', 'PPD'])
  metodo_pago?: 'PUE' | 'PPD';

  @ApiProperty({ example: '601' })
  @IsString()
  regimen_fiscal_receptor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  series?: string;

  @ApiPropertyOptional({ enum: ['demo', 'production'] })
  @IsOptional()
  @IsIn(['demo', 'production'])
  environment?: 'demo' | 'production';
}
