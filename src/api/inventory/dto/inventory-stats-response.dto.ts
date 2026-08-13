import { ApiProperty } from '@nestjs/swagger';

export class InventoryStatsResponseDto {
  @ApiProperty({ description: 'Total de lotes (incluye agotados)', example: 120 })
  total_batches: number;

  @ApiProperty({ description: 'Lotes con existencia > 0', example: 98 })
  batches_with_stock: number;

  @ApiProperty({ description: 'Lotes agotados (existencia = 0)', example: 22 })
  batches_depleted: number;

  @ApiProperty({ description: 'Productos distintos en el alcance', example: 45 })
  total_products: number;

  @ApiProperty({ description: 'Productos con existencia > 0', example: 40 })
  products_with_stock: number;

  @ApiProperty({ description: 'Almacenes con lotes en el alcance', example: 3 })
  total_warehouses: number;

  @ApiProperty({ description: 'Cantidad disponible total', example: '15230.000' })
  total_available_quantity: string;

  @ApiProperty({ description: 'Cantidad inicial total', example: '18000.000' })
  total_initial_quantity: string;

  @ApiProperty({ description: 'Valor a costo de compra (existencia × costo unitario OC)', example: '450000.00' })
  total_cost: string;

  @ApiProperty({ description: 'Valor a precio de venta sugerido (existencia × precio lista)', example: '720000.00' })
  total_sale_value: string;

  @ApiProperty({ description: 'Costo unitario promedio ponderado por existencia', example: '29.55' })
  average_unit_cost: string;

  @ApiProperty({ description: 'Precio unitario promedio ponderado por existencia', example: '47.27' })
  average_unit_price: string;

  @ApiProperty({ description: 'Margen bruto = valor venta − costo', example: '270000.00' })
  gross_margin: string;

  @ApiProperty({ description: 'Margen bruto % sobre valor de venta', example: '37.50' })
  gross_margin_percentage: string;

  @ApiProperty({ description: 'Lotes con stock sin costo de OC', example: 5 })
  batches_without_cost: number;

  @ApiProperty({ description: 'Existencia sin costo de OC', example: '120.000' })
  quantity_without_cost: string;

  @ApiProperty({ description: 'Productos+UOM con stock sin precio de lista', example: 2 })
  products_without_price: number;

  @ApiProperty({ description: 'Existencia sin precio de lista', example: '80.000' })
  quantity_without_price: string;
}
