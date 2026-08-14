import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignUserReportDto {
  @ApiProperty({
    description: 'ID del usuario que queda a cargo de este gerente (responsable)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
