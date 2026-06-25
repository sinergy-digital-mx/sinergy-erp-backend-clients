import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ValidateSellerCodeDto {
  @ApiProperty({ example: 33456 })
  @IsInt()
  @Min(1)
  code: number;
}
