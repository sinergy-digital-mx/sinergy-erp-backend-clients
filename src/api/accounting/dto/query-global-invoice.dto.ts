import { IsString, Matches, IsOptional, IsUUID, IsArray, ArrayMinSize, IsEnum } from 'class-validator';

export class QueryGlobalInvoiceDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Indica el mes con formato AAAA-MM' })
  month: string;

  @IsOptional()
  @IsUUID()
  billing_branch_id?: string;
}

export class CreateGlobalInvoiceDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Indica el mes con formato AAAA-MM' })
  month: string;

  @IsUUID()
  billing_branch_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  order_ids: string[];

  @IsOptional()
  @IsEnum(['demo', 'production'])
  environment?: 'demo' | 'production';
}

export class CancelGlobalInvoiceDto {
  @IsOptional()
  @IsEnum(['demo', 'production'])
  environment?: 'demo' | 'production';
}

