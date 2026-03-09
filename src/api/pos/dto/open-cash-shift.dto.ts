import { IsNumber, IsUUID, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class OpenCashShiftDto {
  @ApiProperty({ description: 'Warehouse ID', example: 'uuid' })
  @IsUUID()
  warehouse_id: string;

  @ApiProperty({ description: 'Initial cash amount', example: 1000 })
  @ValidateIf((o) => !o.opening_balance)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initial_cash?: number;

  @ApiPropertyOptional({ description: 'Opening balance (alias for initial_cash)', example: 1000 })
  @ValidateIf((o) => !o.initial_cash)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  opening_balance?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Turno matutino' })
  @IsOptional()
  @IsString()
  notes?: string;

  // Transform opening_balance to initial_cash if provided
  @Transform(({ obj }) => {
    if (obj.opening_balance !== undefined && obj.initial_cash === undefined) {
      obj.initial_cash = obj.opening_balance;
    }
    return obj.initial_cash;
  })
  get normalizedInitialCash(): number {
    return this.initial_cash || this.opening_balance || 0;
  }
}
