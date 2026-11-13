import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { WHATSAPP_TEXT_MAX_LENGTH } from '../whatsapp.constants';

class SendWhatsappBaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  group_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  reference_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  reference_id?: string;
}

export class SendWhatsappTextDto extends SendWhatsappBaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(WHATSAPP_TEXT_MAX_LENGTH)
  text: string;
}

export class SendWhatsappFileDto extends SendWhatsappBaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  file_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  file_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[\w.+-]+\/[\w.+-]+$/, { message: 'mimetype inválido' })
  mimetype?: string;

  @IsOptional()
  @IsString()
  @MaxLength(WHATSAPP_TEXT_MAX_LENGTH)
  caption?: string;
}

export class WhatsappPairingCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phone: string;
}

export class QueryWhatsappMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['queued', 'sending', 'sent', 'delivered', 'read', 'failed'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  reference_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  reference_id?: string;
}
