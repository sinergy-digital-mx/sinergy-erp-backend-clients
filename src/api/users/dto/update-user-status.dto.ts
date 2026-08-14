import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'ID del estatus (catálogo GET /tenant/users/statuses)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  status_id: number;
}
