import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBillingBranchDto {
  @ApiProperty({ description: 'Branch code', example: 'BRANCH-001' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Street address', example: 'Av. Principal 123' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'City', example: 'Monterrey' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'State', example: 'Nuevo León' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ description: 'Country', example: 'México' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ description: 'Postal code', example: '64000' })
  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @ApiProperty({ description: 'Status: 1 = active, 0 = inactive', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  status?: number;
}
