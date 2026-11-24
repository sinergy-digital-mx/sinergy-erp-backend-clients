import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdatePosCustomerDto {
  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Cliente de la orden. Null usa Público en General.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return value === undefined ? undefined : null;
    }
    return Number(value);
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  customer_id?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  walk_in_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  walk_in_phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  walk_in_rfc?: string;
}
