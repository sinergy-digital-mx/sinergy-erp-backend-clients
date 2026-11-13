import { ApiProperty } from '@nestjs/swagger';

export class InventoryLocationWarehouseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string;
}

export class InventoryLocationBranchDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Nombre de sucursal (code en BD)' })
  name: string;

  @ApiProperty({ description: '1 = activa, 0 = inactiva' })
  status: number;

  @ApiProperty({ type: [InventoryLocationWarehouseDto] })
  warehouses: InventoryLocationWarehouseDto[];
}

export class InventoryLocationFiscalDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  razon_social: string;

  @ApiProperty()
  rfc: string;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status: string;

  @ApiProperty()
  iva_enabled: boolean;

  @ApiProperty()
  ieps_enabled: boolean;

  @ApiProperty({ description: 'Transferencias multi razón social habilitadas' })
  multi_fiscal_transfers_enabled: boolean;

  @ApiProperty({ type: [InventoryLocationBranchDto] })
  branches: InventoryLocationBranchDto[];
}

export class InventoryLocationTreeResponseDto {
  @ApiProperty({ type: [InventoryLocationFiscalDto] })
  data: InventoryLocationFiscalDto[];
}
