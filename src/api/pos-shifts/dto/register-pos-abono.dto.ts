import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';

const ABONO_METHODS = [
  PosSalePaymentMethod.CASH,
  PosSalePaymentMethod.CARD,
  PosSalePaymentMethod.TRANSFER,
  PosSalePaymentMethod.CHECK,
] as const;

export class RegisterPosAbonoDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-11-24' })
  @IsDateString()
  payment_date: string;

  @ApiProperty({ enum: ABONO_METHODS, example: PosSalePaymentMethod.CASH })
  @IsIn(ABONO_METHODS)
  payment_method: (typeof ABONO_METHODS)[number];

  @ApiPropertyOptional({ description: 'Obligatoria en transferencia y cheque' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  billing_branch_id?: string;

  @ApiPropertyOptional({
    description:
      'Persona que cobra el abono, ya validada con su código. Si no se envía, queda la terminal de caja.',
  })
  @IsOptional()
  @IsUUID()
  collected_by_user_id?: string;
}
