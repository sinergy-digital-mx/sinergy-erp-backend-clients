import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class AssignUserBranchDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Sucursal activa / principal. Compatibilidad: si no envías billing_branch_ids, asigna solo esta. null = acceso a todas (solo no POS).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string | null;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Sucursales asignadas. Vacío = acceso a todas (solo no POS).',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  billing_branch_ids?: string[];

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Sucursal principal. Debe estar en billing_branch_ids.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  primary_billing_branch_id?: string | null;
}
