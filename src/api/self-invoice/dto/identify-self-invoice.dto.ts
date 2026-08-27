import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdentifySelfInvoiceDto {
  @ApiProperty({ example: 'ana@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '6641234567' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  phone: string;
}
