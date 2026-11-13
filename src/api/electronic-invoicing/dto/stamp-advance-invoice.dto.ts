import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class StampAdvanceInvoiceDto {
  @ApiPropertyOptional({ description: 'Base sin IVA. Si se omite, usa la base de la cotización u orden.' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  base_amount?: number;

  @ApiPropertyOptional({ description: 'IVA del anticipo. 0, 8 o 16. Si se omite, se infiere del documento.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(16)
  iva_percentage?: number;

  @ApiPropertyOptional({ default: 'G01' })
  @IsOptional()
  @IsString()
  uso_cfdi?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folio?: string;

  @ApiPropertyOptional({ enum: ['demo', 'production'] })
  @IsOptional()
  @IsIn(['demo', 'production'])
  environment?: 'demo' | 'production';
}
