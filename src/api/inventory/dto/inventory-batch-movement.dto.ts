import { ApiProperty } from '@nestjs/swagger';
import type { InventoryBatchMovementType } from '../constants/inventory-batch-movements';

export class InventoryBatchMovementChangeDto {
  @ApiProperty() field: string;
  @ApiProperty() field_label: string;
  @ApiProperty({ nullable: true }) from: string | null;
  @ApiProperty({ nullable: true }) to: string | null;
}

export class InventoryBatchMovementDto {
  @ApiProperty() id: string;
  @ApiProperty() occurred_at: Date;
  @ApiProperty() type: InventoryBatchMovementType;
  @ApiProperty() type_label: string;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ enum: ['in', 'out', 'adjust'] })
  direction: 'in' | 'out' | 'adjust';
  @ApiProperty({ nullable: true }) quantity: string | null;
  @ApiProperty({ nullable: true }) actor_id: string | null;
  @ApiProperty({ nullable: true }) actor_name: string | null;
  @ApiProperty({ nullable: true }) authorized_by_id: string | null;
  @ApiProperty({ nullable: true }) authorized_by_name: string | null;
  @ApiProperty({ nullable: true }) authorized_at: Date | null;
  @ApiProperty({ type: [InventoryBatchMovementChangeDto] })
  changes: InventoryBatchMovementChangeDto[];
  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata: Record<string, unknown>;
}

export class InventoryBatchMovementListResponseDto {
  @ApiProperty({ type: [InventoryBatchMovementDto] })
  data: InventoryBatchMovementDto[];
  @ApiProperty() total: number;
}
