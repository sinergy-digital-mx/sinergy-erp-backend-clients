import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class AssignUserBranchDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Sucursal asignada. null = acceso a todas. Obligatorio si el usuario es POS.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  billing_branch_id?: string | null;
}
