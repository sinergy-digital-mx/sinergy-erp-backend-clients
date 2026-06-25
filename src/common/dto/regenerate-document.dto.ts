import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { DocumentLanguage } from '../enums/document-language.enum';

export class RegenerateDocumentDto {
  @IsEnum(DocumentLanguage)
  language: DocumentLanguage;

  /** Si es true, conserva documentos previos del mismo tipo (permite ES + EN simultáneos). */
  @IsOptional()
  @IsBoolean()
  keep_previous?: boolean;
}
