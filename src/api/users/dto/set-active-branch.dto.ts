import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetActiveBranchDto {
  @ApiProperty({
    description: 'Sucursal activa. Debe estar en las sucursales asignadas al usuario.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  billing_branch_id: string;
}
