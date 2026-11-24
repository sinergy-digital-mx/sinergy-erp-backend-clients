import { ApiProperty } from '@nestjs/swagger';

export class PosBranchStockBranchDto {
  @ApiProperty() id: string;
  @ApiProperty({ description: 'Código de la sucursal' }) name: string;
  @ApiProperty({ nullable: true }) city: string | null;
}

export class PosBranchStockCellDto {
  @ApiProperty() billing_branch_id: string;
  @ApiProperty({ example: '12.000', description: 'Existencia. Sin costo.' }) quantity: string;
  @ApiProperty({ nullable: true }) uom_name: string | null;
}

export class PosBranchStockProductDto {
  @ApiProperty() product_id: string;
  @ApiProperty() sku: string;
  @ApiProperty() name: string;
  @ApiProperty() uom_name: string;
  @ApiProperty() total_quantity: string;
  @ApiProperty({ type: [PosBranchStockCellDto] }) branches: PosBranchStockCellDto[];
}

export class PosBranchStockResponseDto {
  @ApiProperty() search: string;
  @ApiProperty({ description: 'Hay más productos que el tope de la consulta' }) has_more: boolean;
  @ApiProperty({ type: [PosBranchStockBranchDto] }) branches: PosBranchStockBranchDto[];
  @ApiProperty({ type: [PosBranchStockProductDto] }) products: PosBranchStockProductDto[];
}
