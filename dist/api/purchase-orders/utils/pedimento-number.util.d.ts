export declare const PEDIMENTO_DIGIT_COUNT = 15;
export declare const PEDIMENTO_FORMATTED_EXAMPLE = "26  47  3807  6000123";
export declare const PEDIMENTO_FORMAT_ERROR = "El pedimento debe tener 15 d\u00EDgitos con el formato del SAT: a\u00F1o (2), aduana (2), patente (4) y numeraci\u00F3n (7). Ejemplo: 26\u00A0\u00A047\u00A0\u00A03807\u00A0\u00A06000123.";
export declare const PEDIMENTO_YEAR_DIGIT_ERROR = "El d\u00EDgito de a\u00F1o del pedimento debe ser el \u00FAltimo d\u00EDgito del a\u00F1o de validaci\u00F3n, o el del a\u00F1o anterior si es un consolidado.";
export declare const PEDIMENTO_SEQUENCE_ERROR = "La numeraci\u00F3n progresiva del pedimento debe iniciar en 000001.";
export interface ParsedPedimento {
    valid: boolean;
    empty: boolean;
    formatted: string | null;
    message: string | null;
}
export declare function pedimentoDigits(value: string): string;
export declare function formatPedimentoMask(value: string): string;
export declare function formatPedimentoForDisplay(value?: string | null): string | null;
export declare function parsePedimentoNumber(value: unknown): ParsedPedimento;
export declare function normalizePedimentoNumber(value?: string | null): string | null;
