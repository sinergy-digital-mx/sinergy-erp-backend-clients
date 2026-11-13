import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ValidateSellerCodeDto {
  @ApiProperty({ example: 33456 })
  @IsInt()
  @Min(1)
  code: number;

  @ApiProperty({
    required: false,
    description: 'Sucursal seleccionada en POS.',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;
}
