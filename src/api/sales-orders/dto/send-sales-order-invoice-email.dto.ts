import { Transform } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendSalesOrderInvoiceEmailDto {
  /** Destino. Si se omite, se usa el correo del cliente. */
  @IsOptional()
  @IsEmail()
  to_email?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : value,
  )
  cc?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}
