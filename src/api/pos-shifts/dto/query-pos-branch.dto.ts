import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class QueryPosBranchDto {
  @ApiProperty({
    required: false,
    description:
      'Sucursal seleccionada en POS. Si se omite, se usa la sucursal activa del usuario.',
  })
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;
}
