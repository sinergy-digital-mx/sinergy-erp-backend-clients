import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Document type ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  document_type_id: string;

  @ApiProperty({ description: 'Expiration date (optional)', example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  expiration_date?: string;

  @ApiProperty({ description: 'Notes (optional)', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
