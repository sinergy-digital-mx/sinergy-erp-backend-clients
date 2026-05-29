import { IsOptional, IsString, Length, Matches } from 'class-validator';

/** Campos bancarios compartidos (opcionales en create/update). */
export class VendorBankingDto {
  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  bank_account_holder?: string;

  @IsOptional()
  @IsString()
  bank_account_number?: string;

  /** Solo proveedor nacional (México) — 18 dígitos. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{18}$/, { message: 'CLABE debe tener 18 dígitos' })
  bank_clabe?: string;

  /** Solo proveedor internacional. */
  @IsOptional()
  @IsString()
  @Length(8, 11)
  bank_swift_bic?: string;

  @IsOptional()
  @IsString()
  @Length(15, 34)
  bank_iban?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  bank_currency?: string;
}
