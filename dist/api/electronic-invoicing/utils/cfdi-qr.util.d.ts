import { ParsedCfdi } from './cfdi-xml.parser';
export declare function formatCfdiQrTotal(total: string | number): string;
export declare function buildCfdiVerificationUrl(cfdi: ParsedCfdi): string;
export declare function generateCfdiQrDataUrl(verificationUrl: string): Promise<string>;
