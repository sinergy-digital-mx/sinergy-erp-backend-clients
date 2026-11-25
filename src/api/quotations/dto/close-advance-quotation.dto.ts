import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { CreateQuotationLineItemDto } from './create-quotation.dto';

export class CloseAdvanceQuotationDto {
  @ApiProperty({ type: [CreateQuotationLineItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationLineItemDto)
  line_items: CreateQuotationLineItemDto[];

  @ApiPropertyOptional({ enum: ['demo', 'production'] })
  @IsOptional()
  @IsIn(['demo', 'production'])
  environment?: 'demo' | 'production';
}
