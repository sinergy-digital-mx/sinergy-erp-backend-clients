import { IsOptional, IsEmail, IsString, IsArray, MaxLength } from 'class-validator';

export class SendQuotationEmailDto {
  /** Destino. Si se omite, se usa el correo del cliente. */
  @IsOptional()
  @IsEmail()
  to_email?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}
