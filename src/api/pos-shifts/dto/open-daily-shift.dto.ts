import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenDailyShiftDto {
  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  opening_cash_mxn: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  opening_cash_usd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    required: false,
    description:
      'Sucursal seleccionada en POS. El corte se abre en esa sucursal.',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;
}
