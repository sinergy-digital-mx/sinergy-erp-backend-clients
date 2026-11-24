import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class BranchReportProductHitDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
}

export class BranchReportProductSearchResponseDto {
  @ApiProperty({ type: [BranchReportProductHitDto] })
  products: BranchReportProductHitDto[];
}

export class BranchReportSettingsBranchDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'Código de la sucursal' }) name: string;
  @ApiProperty({ nullable: true }) city: string | null;
  @ApiProperty({ nullable: true }) razon_social: string | null;
  @ApiProperty({ description: 'Si sale en el reporte' }) visible: boolean;
}

export class BranchReportSettingsResponseDto {
  @ApiProperty({ description: 'True cuando ya se guardó una selección' })
  configured: boolean;
  @ApiProperty({ type: [BranchReportSettingsBranchDto] })
  branches: BranchReportSettingsBranchDto[];
}

export class UpdateBranchReportSettingsDto {
  @ApiProperty({
    type: [String],
    description: 'Sucursales que salen en el reporte, en el orden de la ficha. Al menos una.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(300)
  @IsUUID('all', { each: true })
  branch_ids: string[];
}

export class BranchReportLineDto {
  @ApiProperty() billing_branch_id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) city: string | null;
  @ApiProperty({ nullable: true }) razon_social: string | null;
  @ApiProperty({ nullable: true }) uom_name: string | null;
  @ApiProperty({ example: '12.000' }) quantity: string;
  @ApiProperty({ nullable: true, example: '27.9454' }) average_unit_cost: string | null;
  @ApiProperty({ nullable: true, example: '97069.2935' }) total_cost: string | null;
  @ApiProperty() cost_complete: boolean;
}

export class BranchReportProductDto {
  @ApiProperty() id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
}

export class BranchStockReportResponseDto {
  @ApiProperty({ type: BranchReportProductDto })
  product: BranchReportProductDto;
  @ApiProperty({ nullable: true }) uom_name: string | null;
  @ApiProperty({ description: 'Hay existencia en más de una unidad. No se suman.' })
  mixed_uom: boolean;
  @ApiProperty({ nullable: true, example: '3624.000' }) total_quantity: string | null;
  @ApiProperty({ nullable: true }) average_unit_cost: string | null;
  @ApiProperty({ nullable: true }) total_cost: string | null;
  @ApiProperty() cost_complete: boolean;
  @ApiProperty({ type: [BranchReportLineDto] })
  lines: BranchReportLineDto[];
}

export class QueryBranchReportDto {
  @ApiProperty()
  @IsUUID('all')
  product_id: string;
}

export class QueryBranchReportProductsDto {
  @ApiPropertyOptional({ description: 'Nombre, SKU o SKU externo' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
}
